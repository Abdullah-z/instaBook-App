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
import { promptSaveImage } from '../utils/MediaUtils';
import * as ExpoLocation from 'expo-location';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { Linking } from 'react-native';
import { getRobustLocation } from '../utils/locationHelper';

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const { initiateCall } = useContext(VoiceCallContext);
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
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
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
              <Ionicons name="create-outline" size={24} color="#000" />
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
                  color={voiceFeedbackEnabled ? '#6200EE' : '#999'}
                />
              </TouchableOpacity>
              {isSpeaking && (
                <View style={{ marginRight: 16 }}>
                  <MaterialIcons name="graphic-eq" size={24} color="#6200EE" />
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
                <MaterialIcons name="call" size={24} color="#1f6feb" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => {
                  const safeAvatar =
                    recipientAvatar && typeof recipientAvatar === 'string' ? recipientAvatar : '';
                  initiateCall(userId, username, safeAvatar, true);
                }}>
                <MaterialIcons name="videocam" size={26} color="#1f6feb" />
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
      quality: 0.8,
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
      });

      // Add user message to UI
      const userMessage = { ...newMessage, _id: res.newMessage?._id || Date.now().toString() };
      setMessages((prev) => [...prev, userMessage]);

      // If AI response exists, add it to UI
      if (res.aiMessage) {
        setTimeout(() => {
          setMessages((prev) => [...prev, res.aiMessage]);
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
        <View
          style={[
            styles.callIconContainer,
            { backgroundColor: isSent ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.05)' },
          ]}>
          <Ionicons name={iconName} size={24} color={iconColor} />
        </View>
        <View style={styles.callInfo}>
          <Text style={[styles.callStatus, isSent ? styles.sentText : styles.receivedText]}>
            {statusText}
          </Text>
          {durationText ? (
            <Text style={[styles.callDuration, isSent ? styles.sentText : styles.receivedText]}>
              {durationText}
            </Text>
          ) : (
            call.status === 'missed' && <Text style={styles.callActionText}>Tap to call back</Text>
          )}
        </View>
      </View>
    );
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
          <Text style={{ fontSize: 10, color: '#666', marginBottom: 2, marginLeft: 12 }}>
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

          <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
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
                          onLongPress={() => promptSaveImage(img.url)}>
                          <Image source={{ uri: img.url }} style={styles.messageImage} />
                        </TouchableOpacity>
                      ) : null
                    )}
                  </View>
                )}
                {item.text && (
                  <Text
                    style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}>
                    {item.text}
                  </Text>
                )}
                {item.location && (
                  <TouchableOpacity
                    onPress={() => {
                      const url = Platform.select({
                        ios: `maps:0,0?q=${item.location.lat},${item.location.lon}`,
                        android: `geo:0,0?q=${item.location.lat},${item.location.lon}(${item.location.address})`,
                      });
                      if (url) Linking.openURL(url);
                    }}
                    onLongPress={() => {
                      navigation.navigate('Map', {
                        lat: item.location.lat,
                        lon: item.location.lon,
                      });
                    }}
                    style={styles.locationMessageContainer}>
                    <View style={styles.locationPreview}>
                      <Ionicons name="location" size={30} color="#1f6feb" />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.locationLabel}>Location</Text>
                        <Text style={styles.locationAddress} numberOfLines={2}>
                          {item.location.address}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.viewOnMapButton}>
                      <TouchableOpacity
                        onPress={() => {
                          navigation.navigate('Map', {
                            lat: item.location.lat,
                            lon: item.location.lon,
                          });
                        }}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          width: '100%',
                          alignItems: 'center',
                        }}>
                        <Text style={styles.viewOnMapText}>View in App</Text>
                      </TouchableOpacity>
                      <View style={{ width: 1, height: '100%', backgroundColor: '#eee' }} />
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
                          paddingVertical: 8,
                          width: '100%',
                          alignItems: 'center',
                        }}>
                        <Text style={styles.viewOnMapText}>Open Maps</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}>
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Send a message to start the conversation</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate(messages)}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Image Preview */}
      {media.length > 0 && (
        <ScrollView horizontal style={styles.mediaPreview}>
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
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="image" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => setLocationModalVisible(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="location" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.hdToggleContainer}>
          <Pressable onPress={() => setIsHD(!isHD)}>
            <Text
              style={[styles.hdToggleText, { color: isHD ? '#4CAF50' : '#666', marginRight: 3 }]}>
              HD
            </Text>
          </Pressable>

          {/* <Switch
            value={isHD}
            onValueChange={setIsHD}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isHD ? '#fff' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
          /> */}
        </View>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            ((!text.trim() && media.length === 0) || sending) && styles.sendButtonDisabled,
          ]}
          onPress={() => handleSend()}
          disabled={(!text.trim() && media.length === 0) || sending}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="send" size={20} color="#000" />
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
          style={{ flex: 1 }}>
          <Pressable
            style={styles.locationModalOverlay}
            onPress={() => setLocationModalVisible(false)}>
            <Pressable style={styles.locationModalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.locationModalHeader}>
                <Text style={styles.locationModalTitle}>Share Location</Text>
                <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.currentLocationButton} onPress={shareCurrentLocation}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.currentLocationButtonText}>Current Location</Text>
              </TouchableOpacity>

              <View style={{ height: 300, paddingBottom: 20 }}>
                <LocationAutocomplete
                  onLocationSelect={(address: string, coordinates: [number, number]) => {
                    handleSend({
                      lat: coordinates[1],
                      lon: coordinates[0],
                      address: address,
                    });
                  }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 10,
    borderRadius: 20,
  },
  sentBubble: {
    backgroundColor: '#D4F637',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
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
  sentText: {
    color: '#000',
  },
  receivedText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  sentTimestamp: {
    color: '#000',
    opacity: 0.6,
    textAlign: 'right',
  },
  receivedTimestamp: {
    color: '#666',
  },
  mediaPreview: {
    maxHeight: 100,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
    borderTopColor: '#eee',
    backgroundColor: '#fff',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D4F637',
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
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateLabel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
    marginTop: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    width: 220,
  },
  locationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  viewOnMapButton: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  viewOnMapText: {
    fontSize: 13,
    color: '#1f6feb',
    fontWeight: '600',
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
});

export default ChatScreen;
