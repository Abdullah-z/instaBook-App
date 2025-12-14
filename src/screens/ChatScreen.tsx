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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getMessages, sendMessage, deleteConversation } from '../api/messageAPI';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import { imageUpload } from '../utils/imageUpload';
import moment from 'moment';

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const { initiateCall } = useContext(VoiceCallContext);
  const { userId, username } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const isUserOnline = onlineUsers.has(userId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
            {username || 'Chat'}
          </Text>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isUserOnline ? '#4CAF50' : '#999',
            }}
          />
        </View>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 12, marginRight: 16 }}>
          <TouchableOpacity
            onPress={() => {
              if (!isUserOnline) {
                Alert.alert('User Offline', 'Cannot call offline users');
                return;
              }
              initiateCall(userId, username);
            }}>
            <MaterialIcons name="call" size={24} color="#1f6feb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteConversation}>
            <Ionicons name="trash-outline" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, username, isUserOnline, userId]);

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
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    navigation.setOptions({ title: username || 'Chat' });
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (msg: any) => {
      const msgSenderId = msg.sender?._id || msg.sender;
      const msgRecipientId = msg.recipient?._id || msg.recipient;

      if (msgSenderId === userId || msgRecipientId === userId) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    socket.on('addMessageToClient', handleIncomingMessage);

    return () => {
      socket.off('addMessageToClient', handleIncomingMessage);
    };
  }, [socket, userId]);

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

  const handleSend = async () => {
    console.log('Sending message...');
    if (!text.trim() && media.length === 0) return;
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
        uploadedMedia = await imageUpload(mediaToSend);
      }

      const newMessage = {
        sender: user?._id,
        recipient: userId,
        text: messageText,
        media: uploadedMedia,
        createdAt: new Date().toISOString(),
      };

      await sendMessage({
        recipient: userId,
        text: messageText,
        media: uploadedMedia,
      });

      setMessages((prev) => [...prev, { ...newMessage, _id: Date.now().toString() }]);

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
      Alert.alert('Error', 'Failed to send message');
      setText(messageText);
      setMedia(mediaToSend);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const senderId = item.sender?._id || item.sender;
    const isSent = senderId === user?._id;

    return (
      <View
        style={[styles.messageContainer, isSent ? styles.sentContainer : styles.receivedContainer]}>
        <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
          {item.media && item.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {item.media.map((img: any, idx: number) => (
                <Image key={idx} source={{ uri: img.url }} style={styles.messageImage} />
              ))}
            </View>
          )}
          {item.text && (
            <Text style={[styles.messageText, isSent ? styles.sentText : styles.receivedText]}>
              {item.text}
            </Text>
          )}
          <Text
            style={[styles.timestamp, isSent ? styles.sentTimestamp : styles.receivedTimestamp]}>
            {moment(item.createdAt).format('HH:mm')}
          </Text>
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
          data={messages}
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
              <Image source={{ uri: item.uri }} style={styles.previewImage} />
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
          onPress={handleSend}
          disabled={(!text.trim() && media.length === 0) || sending}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {sending ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="send" size={20} color="#000" />
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'flex-end',
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
});

export default ChatScreen;
