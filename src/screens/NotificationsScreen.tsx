import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Avatar, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getNotifications, markAsRead, deleteAllNotifications } from '../api/notificationAPI';
import moment from 'moment';
import { addOpacity } from '../utils/colorUtils';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  console.log(notifications);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifies || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = async (notification: any) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      }

      // Navigate to the URL
      if (notification.url) {
        // Parse the URL and navigate accordingly
        // For now, just navigate to profile or post
        if (notification.url.includes('/profile/')) {
          const userId = notification.url.split('/profile/')[1];
          navigation.navigate('Profile', { id: userId });
        } else if (notification.url.includes('/post/')) {
          // Navigate to post detail if you have that screen
          console.log('Navigate to post:', notification.url.split('/post/')[1]);
          navigation.navigate('PostDetail', {
            postId: notification.url.split('/post/')[1],
          });
        }
      }
    } catch (err) {
      console.error('Failed to handle notification:', err);
    }
  };

  const handleDeleteAll = () => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (unreadCount > 0) {
      Alert.alert(
        'Delete All Notifications',
        `You have ${unreadCount} unread notifications. Do you want to delete all notifications?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAllNotifications();
                setNotifications([]);
              } catch (err) {
                console.error('Failed to delete notifications:', err);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Delete All Notifications',
        'Are you sure you want to delete all notifications?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAllNotifications();
                setNotifications([]);
              } catch (err) {
                console.error('Failed to delete notifications:', err);
              }
            },
          },
        ]
      );
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isUnread = !item.isRead;

    // Determine icon based on text content
    let iconName: any = 'notifications';
    let iconColor = theme.colors.primary;

    const text = item.text?.toLowerCase() || '';
    if (text.includes('like')) {
      iconName = 'heart';
      iconColor = theme.colors.primary;
    } else if (text.includes('comment')) {
      iconName = 'chatbubble';
      iconColor = theme.colors.primary;
    } else if (text.includes('follow')) {
      iconName = 'person-add';
      iconColor = theme.colors.primary;
    }

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: theme.colors.surface,
          },
          isUnread && {
            backgroundColor: theme.colors.secondaryContainer,
          },
        ]}
        onPress={() => handleNotificationPress(item)}>
        <View style={styles.avatarWrapper}>
          <Avatar.Image
            size={56}
            source={{ uri: item.user?.avatar }}
            style={{ backgroundColor: theme.colors.surfaceVariant }}
          />
          <View
            style={[
              styles.typeIconBadge,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surface },
            ]}>
            <Ionicons name={iconName} size={12} color={iconColor} />
          </View>
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationText}>
            <Text
              style={[
                styles.username,
                { color: theme.colors.onSurface, fontWeight: '900', fontSize: 15 },
              ]}>
              {item.user?.username}
            </Text>
            <Text
              style={[
                styles.text,
                { color: theme.colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 },
              ]}>
              {' '}
              {item.text}
            </Text>
          </View>
          {item.content && (
            <Text
              style={[
                styles.contentPreview,
                {
                  color: theme.colors.onSurfaceVariant,
                  backgroundColor: addOpacity(theme.colors.onSurface, 0.05),
                },
              ]}
              numberOfLines={1}>
              {item.content}
            </Text>
          )}
          <View style={styles.footer}>
            <Text
              style={[
                styles.timestamp,
                {
                  color: isUnread ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  fontWeight: isUnread ? '800' : '500',
                },
              ]}>
              {moment(item.createdAt).fromNow()}
            </Text>
            {isUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </View>

        {item.image && <Image source={{ uri: item.image }} style={styles.notificationImage} />}
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: addOpacity(theme.colors.onSurface, 0.05),
          },
        ]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.onSurface, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
          ]}>
          Notifications
        </Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={handleDeleteAll}
            style={{
              backgroundColor: addOpacity(theme.colors.error, 0.1),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}>
            <Text style={[styles.deleteButton, { color: theme.colors.error, fontWeight: '800' }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: theme.colors.surfaceVariant,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
              opacity: 0.5,
            }}>
            <Ionicons name="notifications-outline" size={60} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              styles.emptyText,
              { color: theme.colors.onSurface, fontSize: 20, fontWeight: '900' },
            ]}>
            Quiet for now
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
            We'll notify you when something happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  headerTitle: {},
  deleteButton: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 24,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  notificationContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  notificationText: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  username: {},
  text: {},
  contentPreview: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 8,
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {},
  emptySubtext: {
    marginTop: 8,
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default NotificationsScreen;
