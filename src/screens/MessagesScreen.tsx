import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';
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
  const theme = useTheme();
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
        style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
        onPress={() =>
          navigation.navigate('Chat', { userId: otherUser._id, username: otherUser.username })
        }>
        <View style={styles.avatarContainer}>
          {otherUser.avatar &&
          typeof otherUser.avatar === 'string' &&
          otherUser.avatar.trim() !== '' ? (
            <Image
              source={{ uri: otherUser.avatar }}
              style={{ width: 56, height: 56, borderRadius: 28 }}
            />
          ) : (
            <Avatar.Icon size={56} icon="account" />
          )}
          {isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.username, { color: theme.colors.onSurface }]}>
              {otherUser.username}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
              {moment(item.updatedAt).fromNow()}
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}>
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
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
        ]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>Messages</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroupScreen' as never)}
            style={{ marginRight: 15 }}>
            <Ionicons name="people-outline" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { isChatSearch: true })}>
            <Ionicons name="search" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <TouchableOpacity
        style={[
          styles.conversationItem,
          {
            backgroundColor: 'rgba(187, 134, 252, 0.08)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(187, 134, 252, 0.1)',
            marginHorizontal: 12,
            marginTop: 12,
            borderRadius: 24,
            padding: 12,
          },
        ]}
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
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#BB86FC',
            }}>
            <Image
              style={{ width: 40, height: 40 }}
              source={{
                uri: 'https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png',
              }}
            />
          </View>
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: '#BB86FC', borderColor: theme.colors.surface },
            ]}
          />
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.username, { color: '#BB86FC', fontSize: 16, fontWeight: '900' }]}>
              AI Assistant ✨
            </Text>
            <Text
              style={[styles.timestamp, { color: '#BB86FC', fontWeight: 'bold', fontSize: 11 }]}>
              Always Online
            </Text>
          </View>
          <Text
            style={[styles.lastMessage, { color: theme.colors.onSurface, fontWeight: '500' }]}
            numberOfLines={1}>
            Ask me anything...
          </Text>
        </View>
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={theme.colors.outline} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            No messages yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
            Start a conversation with someone!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={({ item }) => {
            if (item.isGroup) {
              return (
                <TouchableOpacity
                  style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
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
                      <Image
                        source={{ uri: item.groupAvatar }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <Avatar.Icon size={56} icon="account-group" />
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                        {item.groupName}
                      </Text>
                      <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                        {moment(item.updatedAt).fromNow()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]}
                      numberOfLines={1}>
                      {item.text || 'No messages yet'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }

            const otherUser = getOtherUser(item);
            if (!otherUser) return null;

            // Hide AI conversations from regular list (we have a dedicated AI button above)
            if (otherUser.role === 'ai_assistant' || otherUser.username === 'ai_assistant') {
              return null;
            }

            const isOnline = onlineUsers.has(otherUser._id);

            return (
              <TouchableOpacity
                style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
                onPress={() =>
                  navigation.navigate('Chat', {
                    userId: otherUser._id,
                    username: otherUser.username,
                    avatar: otherUser.avatar, // Pass avatar
                  })
                }>
                <View style={styles.avatarContainer}>
                  {otherUser.avatar ? (
                    <Image
                      source={{ uri: otherUser.avatar }}
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                    />
                  ) : (
                    <Avatar.Icon size={56} icon="account" />
                  )}
                  {isOnline && (
                    <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
                  )}
                </View>

                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                      {otherUser.username}
                    </Text>
                    <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                      {moment(item.updatedAt).fromNow()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={1}>
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
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessage: {
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
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MessagesScreen;
