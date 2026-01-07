import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getConversations } from '../api/messageAPI';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import moment from 'moment';

const MessagesScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { onlineUsers } = useContext(SocketContext);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const getOtherUser = (conversation: any) => {
    return conversation.recipients?.find((r: any) => r._id !== user?._id);
  };

  const renderConversation = ({ item }: { item: any }) => {
    const otherUser = getOtherUser(item);
    if (!otherUser) return null;

    const isOnline = onlineUsers.has(otherUser._id);

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() =>
          navigation.navigate('Chat', { userId: otherUser._id, username: otherUser.username })
        }>
        <View style={styles.avatarContainer}>
          {otherUser.avatar &&
          typeof otherUser.avatar === 'string' &&
          otherUser.avatar.trim() !== '' ? (
            <Avatar.Image size={56} source={{ uri: otherUser.avatar }} />
          ) : (
            <Avatar.Icon size={56} icon="account" />
          )}
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.username}>{otherUser.username}</Text>
            <Text style={styles.timestamp}>{moment(item.updatedAt).fromNow()}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.call
              ? `${item.call.status === 'missed' ? 'Missed' : item.call.status === 'rejected' ? 'Declined' : ''} ${item.call.video ? 'video' : 'voice'} call`.trim()
              : item.text || (item.media?.length > 0 ? 'Sent an image' : '')}
          </Text>
        </View>
      </TouchableOpacity>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroupScreen' as never)}
            style={{ marginRight: 15 }}>
            <Ionicons name="people-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { isChatSearch: true })}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomWidth: 4, borderBottomColor: '#f8f9fa' }]}
        onPress={async () => {
          try {
            const { getAIUser } = require('../api/userAPI');
            const res = await getAIUser();
            if (res.user) {
              navigation.navigate('Chat', {
                userId: res.user._id,
                username: res.user.username,
                avatar: res.user.avatar,
              });
            }
          } catch (e) {
            console.error(e);
          }
        }}>
        <View style={styles.avatarContainer}>
          <Avatar.Image
            size={56}
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png' }}
          />
          <View style={[styles.onlineIndicator, { backgroundColor: '#BB86FC' }]} />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.username, { color: '#6200EE' }]}>AI Assistant ✨</Text>
            <Text style={[styles.timestamp, { color: '#BB86FC', fontWeight: 'bold' }]}>
              Always Online
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            Ask me anything...
          </Text>
        </View>
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Start a conversation with someone!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item }) => {
            if (item.isGroup) {
              return (
                <TouchableOpacity
                  style={styles.conversationItem}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      userId: item._id,
                      username: item.groupName,
                      avatar: item.groupAvatar,
                      isGroup: true,
                    })
                  }>
                  <View style={styles.avatarContainer}>
                    {item.groupAvatar ? (
                      <Avatar.Image size={56} source={{ uri: item.groupAvatar }} />
                    ) : (
                      <Avatar.Icon size={56} icon="account-group" />
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.username}>{item.groupName}</Text>
                      <Text style={styles.timestamp}>{moment(item.updatedAt).fromNow()}</Text>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {item.text || 'No messages yet'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            const otherUser = getOtherUser(item);
            if (!otherUser) return null;

            const isOnline = onlineUsers.has(otherUser._id);

            return (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() =>
                  navigation.navigate('Chat', {
                    userId: otherUser._id,
                    username: otherUser.username,
                    avatar: otherUser.avatar, // Pass avatar
                  })
                }>
                <View style={styles.avatarContainer}>
                  {otherUser.avatar ? (
                    <Avatar.Image size={56} source={{ uri: otherUser.avatar }} />
                  ) : (
                    <Avatar.Icon size={56} icon="account" />
                  )}
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.username}>{otherUser.username}</Text>
                    <Text style={styles.timestamp}>{moment(item.updatedAt).fromNow()}</Text>
                  </View>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.call
                      ? `${
                          item.call.status === 'missed'
                            ? 'Missed'
                            : item.call.status === 'rejected'
                              ? 'Declined'
                              : ''
                        } ${item.call.video ? 'video' : 'voice'} call`.trim()
                      : item.text || (item.media?.length > 0 ? 'Sent an image' : '')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadConversations();
              }}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
  lastMessage: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
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

export default MessagesScreen;
