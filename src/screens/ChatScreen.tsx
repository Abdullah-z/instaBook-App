import React, { useEffect, useState, useContext, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ScrollView,
  Switch,
  Pressable,
  Modal,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import ImageView from 'react-native-image-viewing';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessages, sendMessage, deleteConversation } from '../api/messageAPI';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import { imageUpload } from '../utils/imageUpload';
import moment from 'moment';
import { promptSaveImage, downloadAndSaveImage } from '../utils/MediaUtils';
import * as ExpoLocation from 'expo-location';
import LocationAutocomplete from '../components/LocationAutocomplete';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { getRobustLocation } from '../utils/locationHelper';

// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const { initiateCall } = useContext(VoiceCallContext);
  const theme = useTheme();
  const { userId, username, avatar, isGroup } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const [isHD, setIsHD] = useState(false);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<any[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Use avatar from params, or try to find it from messages later if needed.
  // Ideally it should be passed in navigation.
  const [recipientAvatar, setRecipientAvatar] = useState(avatar || null);

  const isAIChat = username === 'ai_assistant' || username?.includes('AI Assistant');

  const isUserOnline = !isGroup && onlineUsers.has(userId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onSurface }}>
            {username || 'Chat'}
          </Text>
          {!isGroup && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isUserOnline ? '#4CAF50' : '#999',
                marginLeft: 8,
              }}
            />
          )}
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
          {isGroup ? (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => navigation.navigate('GroupDetailsScreen', { conversationId: userId })}>
              <Ionicons name="create-outline" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ) : isAIChat ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  const newValue = !voiceFeedbackEnabled;
                  setVoiceFeedbackEnabled(newValue);
                  AsyncStorage.setItem('ai_voice_feedback', newValue.toString());
                  Toast.show({
                    type: 'success',
                    text1: newValue ? '🔊 Voice ON' : '🔇 Voice OFF',
                    position: 'bottom',
                    visibilityTime: 1500,
                  });
                }}
                style={{ marginRight: 16 }}>
                <MaterialIcons
                  name={voiceFeedbackEnabled ? 'volume-up' : 'volume-off'}
                  size={24}
                  color={voiceFeedbackEnabled ? theme.colors.primary : theme.colors.outline}
                />
              </TouchableOpacity>
              {isSpeaking && (
                <View style={{ marginRight: 16 }}>
                  <MaterialIcons name="graphic-eq" size={24} color={theme.colors.primary} />
                </View>
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => {
                  const safeAvatar =
                    recipientAvatar && typeof recipientAvatar === 'string' ? recipientAvatar : '';
                  initiateCall(userId, username, safeAvatar);
                }}>
                <MaterialIcons name="call" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => {
                  const safeAvatar =
                    recipientAvatar && typeof recipientAvatar === 'string' ? recipientAvatar : '';
                  initiateCall(userId, username, safeAvatar, true);
                }}>
                <MaterialIcons name="videocam" size={26} color={theme.colors.primary} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={handleDeleteConversation}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [
    navigation,
    username,
    isUserOnline,
    userId,
    recipientAvatar,
    isGroup,
    voiceFeedbackEnabled,
    isSpeaking,
  ]);

  // Load voice preference on mount
  useEffect(() => {
    if (isAIChat) {
      AsyncStorage.getItem('ai_voice_feedback').then((value) => {
        if (value === 'true') {
          setVoiceFeedbackEnabled(true);
        }
      });
    }
  }, [isAIChat]);

  // Auto-speak AI responses
  useEffect(() => {
    if (!voiceFeedbackEnabled || !isAIChat) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender?._id !== user?._id) {
      // This is an AI response
      speakText(lastMessage.text);
    }
  }, [messages, voiceFeedbackEnabled, isAIChat]);

  const handleAICommands = async (messageText: string, aiCommand?: string) => {
    const commandToUse = aiCommand || messageText;
    if (!commandToUse) return;

    // 1. App Navigation
    if (commandToUse.includes('COMMAND:NAVIGATE:')) {
      const match = commandToUse.match(/COMMAND:NAVIGATE:(\w+)/);
      if (match) {
        const screenName = match[1];
        console.log('🤖 AI requesting navigation to:', screenName);

        const routeMap: { [key: string]: string } = {
          Marketplace: 'Marketplace',
          Map: 'Map',
          Discover: 'Discover',
          Notifications: 'Notifications',
          Profile: 'Profile',
          CreatePost: 'CreatePostScreen',
          CreateListing: 'CreateListingScreen',
        };

        const targetRoute = routeMap[screenName];
        if (targetRoute) {
          setTimeout(() => {
            navigation.navigate(targetRoute as never);
            Toast.show({
              type: 'info',
              text1: `Navigating to ${screenName}`,
              position: 'bottom',
            });
          }, 1500);
        }
      }
    }

    // 2. Smart Reminders (Local Notifications)
    if (commandToUse.includes('COMMAND:REMINDER:')) {
      const match = commandToUse.match(/COMMAND:REMINDER:(\d+):(.+)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const reminderText = match[2];
        console.log(`⏰ AI scheduling local reminder: "${reminderText}" in ${minutes}m`);

        try {
          // Request permission if not already granted
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📌 Pipel Reminder',
                body: reminderText,
                data: { screen: 'ChatScreen' },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: minutes * 60,
                repeats: false,
              },
            });
            console.log('✅ Local notification scheduled');
            Toast.show({
              type: 'success',
              text1: 'Reminder set!',
              text2: `I'll remind you in ${minutes} minutes.`,
            });
          }
        } catch (err) {
          console.error('Failed to schedule local notification:', err);
        }
      }
    }
  };

  const speakText = async (text: string) => {
    if (!text) return;

    try {
      // Stop any ongoing speech first
      await Speech.stop();
      setIsSpeaking(true);

      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (err) {
      console.error('Speech error:', err);
      setIsSpeaking(false);
    }
  };

  if (!route.params) {
    return (
      <View style={styles.centerContainer}>
        <Text>Error: Missing chat parameters</Text>
      </View>
    );
  }

  const handleDeleteConversation = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this entire conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(userId);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete conversation:', err);
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const loadMessages = async () => {
    try {
      const res = await getMessages(userId);
      setMessages((res.messages || []).reverse());

      // For 1-on-1, try to find avatar from messages if not provided
      if (!isGroup && !recipientAvatar && res.messages && res.messages.length > 0) {
        const otherUserMsg = res.messages.find((m: any) => (m.sender?._id || m.sender) === userId);
        if (otherUserMsg && otherUserMsg.sender?.avatar) {
          setRecipientAvatar(otherUserMsg.sender.avatar);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg: any) => {
      if (!msg) return;
      try {
        const msgSenderId = msg.sender?._id || msg.sender;
        const msgRecipientId = msg.recipient?._id || msg.recipient;
        // Check for Group Conversation ID match
        const msgConversationId = msg.conversation;

        if (
          isGroup
            ? msgConversationId === userId
            : msgSenderId === userId || msgRecipientId === userId
        ) {
          setMessages((prev) => [...prev, msg]);

          // Handle AI Navigation if applicable
          if (isAIChat && msgSenderId === userId) {
            handleAICommands(msg.text, msg.aiCommand);
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (err) {
        console.error('❌ Error handling incoming message:', err);
      }
    };

    socket.on('addMessageToClient', handleIncomingMessage);

    return () => {
      socket.off('addMessageToClient', handleIncomingMessage);
    };
  }, [socket, userId, isGroup]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMedia([...media, ...result.assets]);
    }
  };

  const handleDeleteMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    setMedia(newMedia);
  };

  const handleSend = async (locationData?: any) => {
    console.log('Sending message...');
    if (!text.trim() && media.length === 0 && !locationData) return;
    if (sending) return;

    // Check if socket is connected
    if (!socket || !socket.connected) {
      console.error('Socket is not connected');
      Alert.alert('Error', 'Connection lost. Please try again.');
      return;
    }

    const messageText = text.trim();
    setText('');
    const mediaToSend = [...media];
    setMedia([]);
    setSending(true);

    try {
      let uploadedMedia: any[] = [];
      if (mediaToSend.length > 0) {
        uploadedMedia = await imageUpload(mediaToSend, isHD);
      }

      const newMessage = {
        sender: user?._id,
        recipient: isGroup ? null : userId,
        conversation: isGroup ? userId : null, // Assuming userId param IS conversationId for groups
        text: messageText,
        media: uploadedMedia,
        location: locationData,
        createdAt: new Date().toISOString(),
      };

      const res = await sendMessage({
        recipient: isGroup ? undefined : userId,
        conversationId: isGroup ? userId : undefined,
        text: messageText,
        media: uploadedMedia,
        location: locationData,
        clientTime: new Date().toString(), // Pass local time for AI
      });

      // Add user message to UI
      const userMessage = { ...newMessage, _id: res.newMessage?._id || Date.now().toString() };
      setMessages((prev) => [...prev, userMessage]);

      // If AI response exists, add it to UI
      if (res.aiMessage) {
        setTimeout(() => {
          setMessages((prev) => [...prev, res.aiMessage]);
          handleAICommands(res.aiMessage.text, res.aiMessage.aiCommand);
        }, 500); // Slight delay for natural feel
      }

      if (socket && socket.connected) {
        // Send full user object for socket (so recipient can get username/avatar)
        socket.emit('addMessage', {
          ...newMessage,
          sender: user,
        });
      }

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Alert.alert('Error', 'Failed to send message'); // Removed to prevent hard crash loops
      Toast.show({
        type: 'error',
        text1: 'Message failed to send',
        text2: 'Please checking your connection.',
      });
      setText(messageText);
      setMedia(mediaToSend);
    } finally {
      setSending(false);
      setIsHD(false);
      setLocationModalVisible(false);
    }
  };

  const shareCurrentLocation = async () => {
    console.log('📍 [CHAT-DEBUG] ===== Share Current Location Called =====');
    try {
      console.log('📍 [CHAT-DEBUG] Checking current permission status...');
      let { status } = await ExpoLocation.getForegroundPermissionsAsync();
      console.log('📍 [CHAT-DEBUG] Current permission status:', status);

      if (status !== 'granted') {
        console.log('📍 [CHAT-DEBUG] Permission not granted, requesting...');
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
        console.log('📍 [CHAT-DEBUG] New permission status:', status);
      } else {
        console.log('📍 [CHAT-DEBUG] Permission already granted, skipping request');
      }

      if (status !== 'granted') {
        console.error('❌ [CHAT-DEBUG] Permission denied! Status:', status);
        Alert.alert('Permission denied', 'Allow location access to share your location.');
        return;
      }

      console.log('📍 [CHAT-DEBUG] Permission granted, calling getRobustLocation...');
      const loc = await getRobustLocation();
      console.log('📍 [CHAT-DEBUG] getRobustLocation returned:', loc ? 'SUCCESS' : 'NULL');

      if (!loc) {
        console.error('❌ [CHAT-DEBUG] Location is null!');
        Alert.alert('Error', 'Failed to get current location');
        return;
      }

      console.log('📍 [CHAT-DEBUG] Got location, reverse geocoding...');
      // Reverse geocode to get address
      const reverse = await ExpoLocation.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      let address = 'Shared Location';
      if (reverse.length > 0) {
        const r = reverse[0];
        address = `${r.name || ''} ${r.street || ''}, ${r.city || ''}`.trim();
      }

      console.log('📍 [CHAT-DEBUG] Sending location message...');
      handleSend({
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
        address: address,
      });
      console.log('✅ [CHAT-DEBUG] Location shared successfully!');
    } catch (err) {
      console.error('💥 [CHAT-DEBUG] Exception caught:', err);
      console.error('💥 [CHAT-DEBUG] Error type:', typeof err);
      console.error(
        '💥 [CHAT-DEBUG] Error message:',
        err instanceof Error ? err.message : String(err)
      );
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const grouped: any[] = [];
    let lastDate = '';

    msgs.forEach((msg) => {
      const date = moment(msg.createdAt).format('MMMM D, YYYY');
      if (date !== lastDate) {
        grouped.push({ _id: `date-${date}`, type: 'date', date });
        lastDate = date;
      }
      grouped.push(msg);
    });

    return grouped;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sec`;
    return `${mins} min ${secs} sec`;
  };

  const renderCallLog = (call: any, isSent: boolean) => {
    let iconName: any = 'call';
    let statusText = 'Voice call';
    let durationText = '';
    let iconColor = isSent ? '#000' : '#444';

    if (call.video) {
      iconName = 'videocam';
      statusText = 'Video call';
    }

    switch (call.status) {
      case 'accepted':
        durationText = formatDuration(call.duration);
        break;
      case 'rejected':
        statusText = `Declined ${call.video ? 'video' : 'voice'} call`;
        iconColor = '#ff4444';
        break;
      case 'missed':
        statusText = `Missed ${call.video ? 'video' : 'voice'} call`;
        iconColor = '#ff4444';
        break;
      default:
        break;
    }

    return (
      <View style={styles.callLogContent}>
        <View style={[styles.callIconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons
            name={iconName}
            size={24}
            color={isSent ? theme.colors.primary : theme.colors.onSurface}
          />
        </View>
        <View style={styles.callInfo}>
          <Text
            style={[
              styles.callStatus,
              isSent ? { color: theme.colors.onPrimary } : { color: theme.colors.onSurface },
            ]}>
            {statusText}
          </Text>
          {durationText ? (
            <Text
              style={[
                styles.callDuration,
                isSent
                  ? { color: theme.colors.onPrimary, opacity: 0.8 }
                  : { color: theme.colors.onSurface, opacity: 0.7 },
              ]}>
              {durationText}
            </Text>
          ) : (
            call.status === 'missed' && (
              <Text style={[styles.callActionText, { color: theme.colors.primary }]}>
                Tap to call back
              </Text>
            )
          )}
        </View>
      </View>
    );
  };

  const cleanMessageText = (text: string) => {
    if (!text) return '';
    const cleaned = text
      .replace(/COMMAND:NAVIGATE:\w+/g, '')
      .replace(/COMMAND:REMINDER:\d+:.+/g, '')
      .replace(/AI_IMAGE_URL:https?:\/\/[^\s]+/g, '')
      .replace(/\[METADATA:.*?\]/g, '') // Also clean the new metadata tags for user view
      .trim();

    return cleaned;
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (!item) return null;

    if (item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.dateLabel}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      );
    }

    const senderId = item.sender?._id || item.sender;
    const isSent = senderId === user?._id;

    const senderName = item.sender?.username || 'User';
    const senderAvatar = item.sender?.avatar;

    return (
      <View
        style={[styles.messageContainer, isSent ? styles.sentContainer : styles.receivedContainer]}>
        {!isSent && route.params.isGroup && (
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 2,
              marginLeft: 12,
            }}>
            {senderName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {!isSent && route.params.isGroup && (
            <Image
              source={{ uri: senderAvatar }}
              style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8, marginBottom: 4 }}
            />
          )}

          <View
            style={[
              styles.messageBubble,
              isSent
                ? [styles.sentBubble, { backgroundColor: theme.colors.primary }]
                : [styles.receivedBubble, { backgroundColor: theme.colors.surfaceVariant }],
            ]}>
            {item.call ? (
              renderCallLog(item.call, isSent)
            ) : (
              <>
                {item.media && item.media.length > 0 && (
                  <View style={styles.mediaContainer}>
                    {item.media.map((img: any, idx: number) =>
                      img?.url && typeof img.url === 'string' && img.url.trim() !== '' ? (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.9}
                          onPress={() => {
                            const images = item.media
                              .filter((m: any) => m.url)
                              .map((m: any) => ({ uri: m.url }));
                            setViewerImages(images);
                            setViewerIndex(idx);
                            setViewerVisible(true);
                          }}
                          onLongPress={() => promptSaveImage(img.url)}>
                          <Image source={{ uri: img.url }} style={styles.messageImage} />
                        </TouchableOpacity>
                      ) : null
                    )}
                  </View>
                )}
                {item.text && item.text.includes('AI_IMAGE_URL:') && (
                  <View style={styles.aiImageContainer}>
                    {(() => {
                      const match = item.text.match(/AI_IMAGE_URL:(https?:\/\/[^\s]+)/);
                      const imageUrl = match ? match[1] : null;
                      return imageUrl ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            setViewerImages([{ uri: imageUrl }]);
                            setViewerIndex(0);
                            setViewerVisible(true);
                          }}
                          onLongPress={() => promptSaveImage(imageUrl)}>
                          <Image source={{ uri: imageUrl }} style={styles.aiGeneratedImage} />
                          <View style={styles.aiImageBadge}>
                            <Ionicons name="sparkles" size={12} color="#fff" />
                            <Text style={styles.aiImageBadgeText}>AI Generated</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null;
                    })()}
                  </View>
                )}
                {(item.text && cleanMessageText(item.text) !== '') || item.aiCommand ? (
                  <Text
                    style={[
                      styles.messageText,
                      isSent
                        ? [styles.sentText, { color: theme.colors.onPrimary }]
                        : [styles.receivedText, { color: theme.colors.onSurface }],
                    ]}>
                    {cleanMessageText(item.text) || 'Command executed.'}
                  </Text>
                ) : null}
                {item.searchResults && item.searchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    {item.searchResults.map((result: any, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.resultCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.outlineVariant,
                          },
                        ]}>
                        <View style={styles.resultHeader}>
                          {result.type === 'user' && (
                            <Image source={{ uri: result.avatar }} style={styles.resultAvatar} />
                          )}
                          <View style={styles.resultInfo}>
                            <Text
                              style={[styles.resultTitle, { color: theme.colors.onSurface }]}
                              numberOfLines={1}>
                              {result.type === 'user'
                                ? result.fullname
                                : result.name || result.content.substring(0, 30) + '...'}
                            </Text>
                            {result.type === 'user' && (
                              <Text
                                style={[
                                  styles.resultSubtitle,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}>
                                @{result.username}
                              </Text>
                            )}
                            {result.type === 'listing' && (
                              <Text style={[styles.resultPrice, { color: theme.colors.primary }]}>
                                ${result.price}
                              </Text>
                            )}
                            {result.type === 'post' && (
                              <Text
                                style={[
                                  styles.resultSubtitle,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}>
                                by @{result.author}
                              </Text>
                            )}
                          </View>
                        </View>
                        {result.type === 'listing' && result.description && (
                          <Text style={styles.resultDescription} numberOfLines={2}>
                            {result.description}
                          </Text>
                        )}
                        {result.type === 'listing' && (
                          <View style={{ marginBottom: 8 }}>
                            {result.address && (
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginBottom: 4,
                                }}>
                                <Ionicons
                                  name="location-outline"
                                  size={12}
                                  color={theme.colors.onSurfaceVariant}
                                />
                                <Text
                                  style={[
                                    styles.resultSubtitle,
                                    { marginLeft: 4, color: theme.colors.onSurfaceVariant },
                                  ]}>
                                  {result.address}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                        {result.image && (result.type === 'post' || result.type === 'listing') && (
                          <Image source={{ uri: result.image }} style={styles.resultImage} />
                        )}
                        <TouchableOpacity
                          style={[styles.resultButton, { backgroundColor: theme.colors.primary }]}
                          onPress={() => {
                            console.log(`🚀 [AI-NAV] Navigating to ${result.type}:`, result._id);
                            if (result.type === 'user') {
                              navigation.navigate(
                                'Profile' as never,
                                { userId: result._id } as never
                              );
                            } else if (result.type === 'listing') {
                              navigation.navigate(
                                'ListingDetail' as never,
                                { id: result._id } as never
                              );
                            } else if (result.type === 'post') {
                              navigation.navigate(
                                'PostDetail' as never,
                                { postId: result._id } as never
                              );
                            }
                          }}>
                          <Text
                            style={[styles.resultButtonText, { color: theme.colors.onPrimary }]}>
                            {result.type === 'user'
                              ? 'View Profile'
                              : result.type === 'post'
                                ? 'View Post'
                                : 'View Product'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                {item.weatherData && (
                  <View style={styles.weatherCard}>
                    <View style={styles.weatherHeader}>
                      <Ionicons
                        name={
                          item.weatherData.condition?.toLowerCase().includes('cloud')
                            ? 'cloudy'
                            : item.weatherData.condition?.toLowerCase().includes('rain')
                              ? 'rainy'
                              : item.weatherData.condition?.toLowerCase().includes('clear')
                                ? 'sunny'
                                : item.weatherData.condition?.toLowerCase().includes('snow')
                                  ? 'snow'
                                  : item.weatherData.condition?.toLowerCase().includes('thunder')
                                    ? 'thunderstorm'
                                    : 'partly-sunny'
                        }
                        size={40}
                        color="#FFD700"
                      />
                      <View style={{ marginLeft: 15 }}>
                        <Text style={styles.weatherCity}>{item.weatherData.city}</Text>
                        <Text style={styles.weatherTemp}>
                          {Math.round(item.weatherData.temp)}°C
                        </Text>
                      </View>
                    </View>
                    <View style={styles.weatherDetails}>
                      <Text style={styles.weatherCondition}>{item.weatherData.condition}</Text>
                      <Text style={styles.weatherHumidity}>
                        Humidity: {item.weatherData.humidity}%
                      </Text>
                    </View>
                  </View>
                )}
                {item.location &&
                  item.location.lat &&
                  item.location.lon &&
                  !item.weatherData &&
                  (!item.searchResults || item.searchResults.length === 0) && (
                    <View
                      style={[
                        styles.locationMessageContainer,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.outlineVariant,
                        },
                      ]}>
                      <TouchableOpacity
                        onPress={() => {
                          const url = Platform.select({
                            ios: `maps:0,0?q=${item.location.lat},${item.location.lon}`,
                            android: `geo:0,0?q=${item.location.lat},${item.location.lon}(${item.location.address})`,
                          });
                          if (url) Linking.openURL(url);
                        }}
                        style={[
                          styles.locationPreview,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            backgroundColor: theme.colors.primaryContainer,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Ionicons
                            name="location-sharp"
                            size={24}
                            color={theme.colors.onPrimaryContainer}
                          />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={[styles.locationLabel, { color: theme.colors.onSurface }]}>
                            Location
                          </Text>
                          <Text
                            style={[
                              styles.locationAddress,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
                            numberOfLines={2}>
                            {item.location.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View
                        style={[
                          styles.viewOnMapButton,
                          {
                            borderTopColor: theme.colors.outlineVariant,
                          },
                        ]}>
                        <TouchableOpacity
                          onPress={() => {
                            navigation.navigate(
                              'Map' as never,
                              {
                                lat: item.location.lat,
                                lon: item.location.lon,
                              } as never
                            );
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            alignItems: 'center',
                          }}>
                          <Text style={[styles.viewOnMapText, { color: theme.colors.primary }]}>
                            View in App
                          </Text>
                        </TouchableOpacity>
                        <View
                          style={{
                            width: 1,
                            height: '100%',
                            backgroundColor: theme.colors.outlineVariant,
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            const url = Platform.select({
                              ios: `maps:0,0?q=${item.location.lat},${item.location.lon}`,
                              android: `geo:0,0?q=${item.location.lat},${item.location.lon}(${item.location.address})`,
                            });
                            if (url) Linking.openURL(url);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            alignItems: 'center',
                          }}>
                          <Text style={[styles.viewOnMapText, { color: theme.colors.primary }]}>
                            Open Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
              </>
            )}
            <Text
              style={[styles.timestamp, isSent ? styles.sentTimestamp : styles.receivedTimestamp]}>
              {moment(item.createdAt).format('HH:mm')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 120}>
      <FlatList
        ref={flatListRef}
        data={groupMessagesByDate(messages)}
        renderItem={renderMessage}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color={theme.colors.outline} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                No messages yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Send a message to start the conversation!
              </Text>
            </View>
          ) : null
        }
      />

      {/* Image Preview */}
      {media.length > 0 && (
        <View
          style={[
            styles.mediaPreview,
            { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
          ]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {media.map((item, index) => (
              <View key={index} style={styles.previewImageContainer}>
                {item.uri ? (
                  <Image source={{ uri: item.uri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, { backgroundColor: '#eee' }]} />
                )}
                <TouchableOpacity
                  style={styles.deleteMediaButton}
                  onPress={() => handleDeleteMedia(index)}>
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
          <View style={styles.hdToggleContainer}>
            <Text style={[styles.hdToggleText, { color: theme.colors.onSurfaceVariant }]}>HD</Text>
            <Switch
              value={isHD}
              onValueChange={setIsHD}
              trackColor={{ false: theme.colors.onSurfaceVariant, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
              style={{ transform: [{ scaleX: 0.55 }, { scaleY: 0.55 }] }}
            />
          </View>
          <TouchableOpacity style={{ padding: 8 }} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => setLocationModalVisible(true)}>
            <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurface },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={text}
          onChangeText={setText}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: theme.colors.primary },
            (!text.trim() && media.length === 0) || sending ? styles.sendButtonDisabled : null,
          ]}
          onPress={() => handleSend()}>
          {sending ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Location Selector Modal */}
      <Modal
        visible={locationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLocationModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={{ flex: 1 }}>
          <Pressable
            style={styles.locationModalOverlay}
            onPress={() => setLocationModalVisible(false)}>
            <Pressable
              style={[styles.locationModalContent, { backgroundColor: theme.colors.surface }]}
              onPress={(e) => e.stopPropagation()}>
              <View
                style={[styles.locationModalContent, { backgroundColor: theme.colors.background }]}>
                <View style={styles.locationModalHeader}>
                  <Text style={[styles.locationModalTitle, { color: theme.colors.onSurface }]}>
                    Share Location
                  </Text>
                  <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.onSurface} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.currentLocationButton, { backgroundColor: theme.colors.primary }]}
                  onPress={shareCurrentLocation}>
                  <Ionicons name="location" size={20} color={theme.colors.onPrimary} />
                  <Text
                    style={[styles.currentLocationButtonText, { color: theme.colors.onPrimary }]}>
                    Share Current Location
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 400 }}>
                  <LocationAutocomplete
                    onLocationSelect={(address: string, coordinates: [number, number]) => {
                      console.log('📍 [LOCATION-AUTOCOMPLETE] Selected:', address, coordinates);
                      handleSend({
                        lat: coordinates[1],
                        lon: coordinates[0],
                        address: address,
                      });
                    }}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ImageView
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        HeaderComponent={({ imageIndex }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 20,
              paddingTop: 50,
            }}>
            <TouchableOpacity
              onPress={() =>
                viewerImages[imageIndex] && downloadAndSaveImage(viewerImages[imageIndex].uri)
              }
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: 10,
                borderRadius: 25,
              }}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sentBubble: {
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    borderTopLeftRadius: 4,
  },
  mediaContainer: {
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {},
  receivedText: {},
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  sentTimestamp: {
    opacity: 0.6,
    textAlign: 'right',
  },
  receivedTimestamp: {},
  mediaPreview: {
    maxHeight: 100,
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  previewImageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  deleteMediaButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dateLabel: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  callLogContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 150,
  },
  callIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  callInfo: {
    flex: 1,
  },
  callStatus: {
    fontSize: 15,
    fontWeight: '600',
  },
  callDuration: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.7,
  },
  callActionText: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  hdToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  hdToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationMessageContainer: {
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    width: 260,
    borderWidth: 1,
  },
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  locationAddress: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  viewOnMapButton: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewOnMapText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  locationModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    marginBottom: 15,
  },
  currentLocationButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  searchResultsContainer: {
    marginTop: 10,
    width: 240,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    fontSize: 12,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },
  resultImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 8,
    resizeMode: 'cover',
  },
  resultDescription: {
    fontSize: 12,
    color: '#444',
    marginBottom: 8,
    lineHeight: 16,
  },
  resultButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  aiImageContainer: {
    width: 240,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  aiGeneratedImage: {
    width: '100%',
    height: 240,
    resizeMode: 'cover',
  },
  aiImageBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aiImageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  weatherCard: {
    backgroundColor: '#1f6feb',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    width: 220,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherCity: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  weatherTemp: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  weatherDetails: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  weatherCondition: {
    color: '#fff',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  weatherHumidity: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
});

export default ChatScreen;
