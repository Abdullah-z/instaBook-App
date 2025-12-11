import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { followUserAPI, unfollowUserAPI } from '../api/profileAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const SuggestedUsers = ({ users }: { users: any[] }) => {
  const navigation = useNavigation<any>();
  const [following, setFollowing] = useState<string[]>([]);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const handleFollow = async (item: any) => {
    if (following.includes(item._id)) {
      // Unfollow logic
      setFollowing((prev) => prev.filter((id) => id !== item._id));
      try {
        await unfollowUserAPI(item._id);
        socket?.emit('unFollow', {
          ...item,
          followers: item.followers.filter((f: any) => f._id !== user._id),
        });

        const msg = {
          id: user._id,
          text: 'started following you',
          recipients: [item._id],
          url: `/profile/${user._id}`,
        };
        await removeNotification(msg.id, msg.url);
        socket?.emit('removeNotify', msg);
      } catch (err) {
        console.error('Unfollow failed', err);
        setFollowing((prev) => [...prev, item._id]); // Revert
      }
    } else {
      // Follow logic
      setFollowing((prev) => [...prev, item._id]);
      try {
        await followUserAPI(item._id);
        const newUser = { ...item, followers: [...(item.followers || []), user] };
        socket?.emit('follow', newUser);

        const msg = {
          id: user._id,
          text: 'started following you',
          recipients: [item._id],
          url: `/profile/${user._id}`,
          content: '',
          image: user.avatar,
        };
        await createNotification(msg);
        socket?.emit('createNotify', msg);
      } catch (err) {
        console.error('Follow failed', err);
        setFollowing((prev) => prev.filter((id) => id !== item._id)); // Revert
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isFollowing = following.includes(item._id);

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: item._id })}>
          <Avatar.Image size={60} source={{ uri: item.avatar }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.username} numberOfLines={1}>
          {item.username}
        </Text>
        <Text style={styles.fullname} numberOfLines={1}>
          {item.fullname}
        </Text>

        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={() => handleFollow(item)}>
          <Text style={[styles.followText, isFollowing && styles.followingText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!users || users.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggested for you</Text>
        {/* <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity> */}
      </View>
      <FlatList
        horizontal
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

export default SuggestedUsers;

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  seeAll: {
    color: '#007AFF',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
  },
  card: {
    width: 140, // Fixed width for cards
    height: 180,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginHorizontal: 4,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  fullname: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  followButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#eee',
  },
  followText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  followingText: {
    color: '#333',
  },
});
