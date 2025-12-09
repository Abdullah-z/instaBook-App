import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getNotifications, markAsRead, deleteAllNotifications } from '../api/notificationAPI';
import moment from 'moment';

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
          console.log('Navigate to post:', notification.url);
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

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}>
      <Avatar.Image size={50} source={{ uri: item.user?.avatar }} />

      <View style={styles.notificationContent}>
        <View style={styles.notificationText}>
          <Text style={styles.username}>{item.user?.username}</Text>
          <Text style={styles.text}> {item.text}</Text>
        </View>
        {item.content && (
          <Text style={styles.content} numberOfLines={1}>
            {item.content}
          </Text>
        )}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{moment(item.createdAt).fromNow()}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>

      {item.image && (
        <Avatar.Image size={40} source={{ uri: item.image }} style={styles.notificationImage} />
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleDeleteAll}>
            <Text style={styles.deleteButton}>Delete All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  unreadItem: {
    backgroundColor: '#f9f9f9',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  notificationText: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
  },
  text: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4F637',
    marginLeft: 8,
  },
  notificationImage: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

export default NotificationsScreen;
