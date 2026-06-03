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
import { addOpacity } from '../utils/colorUtils';

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
    if (item.isGroup) {
      const isUnread = false; // Mocking unread status for now as it's not in schema yet
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
          <View style={styles.avatarWrapper}>
            {item.groupAvatar ? (
              <Image source={{ uri: item.groupAvatar }} style={styles.groupAvatarImage} />
            ) : (
              <View
                style={[
                  styles.groupAvatarPlaceholder,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}>
                <Ionicons name="people" size={28} color={theme.colors.onPrimaryContainer} />
              </View>
            )}
          </View>

          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.username, { color: theme.colors.onSurface, fontWeight: '900' }]}>
                {item.groupName}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                {moment(item.updatedAt).fromNow(true)}
              </Text>
            </View>
            <View style={styles.messageRow}>
              <Text
                style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}>
                {item.text || 'No messages yet'}
              </Text>
              {isUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
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
    const isUnread = false; // Mocking

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { backgroundColor: theme.colors.surface }]}
        onPress={() =>
          navigation.navigate('Chat', {
            userId: otherUser._id,
            username: otherUser.username,
            avatar: otherUser.avatar,
          })
        }>
        <View style={styles.avatarWrapper}>
          {otherUser.avatar ? (
            <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
          ) : (
            <Avatar.Icon
              size={56}
              icon="account"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
          )}
          {isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: theme.colors.surface }]} />
          )}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[
                styles.username,
                { color: theme.colors.onSurface, fontWeight: '900', fontSize: 16 },
              ]}>
              {otherUser.username}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
              {moment(item.updatedAt).fromNow(true)}
            </Text>
          </View>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                { color: theme.colors.onSurfaceVariant, fontSize: 14, flex: 1 },
              ]}
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
            {isUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
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
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.onSurface, fontSize: 32, fontWeight: '900', letterSpacing: -1 },
          ]}>
          Chats
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroupScreen' as never)}
            style={[styles.headerIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="people" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('NearbyChat' as never)}
            style={[styles.headerIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="radio" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Search', { isChatSearch: true })}
            style={[styles.headerIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Ionicons name="search" size={22} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Assistant Card - Premium Design */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.aiAssistantCard,
          {
            backgroundColor: theme.dark ? '#1A1A1A' : '#F9F5FF',
            borderColor: addOpacity('#BB86FC', 0.2),
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
        <View style={styles.aiAvatarContainer}>
          <View style={{ position: 'relative' }}>
            <View style={[styles.aiIconWrapper, { backgroundColor: theme.colors.surface }]}>
              <Image
                style={{ width: 32, height: 32 }}
                source={{
                  uri: 'https://static.vecteezy.com/system/resources/previews/055/687/055/non_2x/rectangle-gemini-google-icon-symbol-logo-free-png.png',
                }}
              />
            </View>
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: '#BB86FC', borderColor: theme.dark ? '#1A1A1A' : '#F9F5FF' },
              ]}
            />
          </View>
        </View>
        <View style={styles.aiContent}>
          <View style={styles.aiHeader}>
            <Text style={[styles.aiTitle, { color: '#BB86FC' }]}>AI Assistant ✨</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>PRO</Text>
            </View>
          </View>
          <Text style={[styles.aiSubtext, { color: theme.colors.onSurface }]} numberOfLines={1}>
            Always online to help you with anything...
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#BB86FC" style={{ opacity: 0.5 }} />
      </TouchableOpacity>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              opacity: 0.6,
            }}>
            <Ionicons name="chatbubbles-outline" size={50} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.onSurface, fontSize: 18, fontWeight: '900' },
            ]}>
            No messages yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
            Connect with friends and start talking!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadConversations();
              }}
              tintColor={theme.colors.primary}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {},
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 24,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  groupAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 24,
  },
  groupAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {},
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    opacity: 0.8,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  aiAssistantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 28,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#BB86FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiAvatarContainer: {
    position: 'relative',
  },
  aiIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BB86FC',
  },
  aiContent: {
    flex: 1,
    marginLeft: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  aiBadge: {
    backgroundColor: '#BB86FC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 8,
  },
  aiBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  aiSubtext: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  emptyText: {},
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.6,
  },
});

export default MessagesScreen;
