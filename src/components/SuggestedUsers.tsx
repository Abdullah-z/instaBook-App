import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Button, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { followUserAPI, unfollowUserAPI } from '../api/profileAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { addOpacity } from '../utils/colorUtils';

const SuggestedUsers = ({ users }: { users: any[] }) => {
  const navigation = useNavigation<any>();
  const [following, setFollowing] = useState<string[]>([]);
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const theme = useTheme();

  const handleFollow = async (item: any) => {
    if (!user) return;
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
          recipients: [item._id] as string[],
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
          recipients: [item._id] as string[],
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

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isFollowing = following.includes(item._id);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: addOpacity(theme.colors.secondaryContainer, theme.dark ? 0.15 : 0.05),
            borderColor: theme.colors.outlineVariant,
          },
        ]}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: item._id })}>
          <Avatar.Image
            size={60}
            source={{ uri: item.avatar }}
            style={[styles.avatar, { backgroundColor: theme.colors.surfaceVariant }]}
          />
        </TouchableOpacity>
        <Text style={[styles.username, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {item.username}
        </Text>
        <Text style={[styles.fullname, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
          {item.fullname}
        </Text>

        <TouchableOpacity
          style={[
            styles.followButton,
            {
              backgroundColor: theme.colors.primary,
            },
            isFollowing && [
              styles.followingButton,
              { backgroundColor: theme.colors.surfaceVariant },
            ],
          ]}
          onPress={() => handleFollow(item)}>
          <Text
            style={[
              styles.followText,
              { color: theme.colors.onPrimary },
              isFollowing && [styles.followingText, { color: theme.colors.onSurfaceVariant }],
            ]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!users || users.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderBottomColor: theme.colors.outlineVariant,
        },
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>Suggested for you</Text>
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

export default React.memo(SuggestedUsers);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
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
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 12,
  },
  card: {
    width: 140, // Fixed width for cards
    height: 180,
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 4,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 8,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  fullname: {
    fontSize: 12,
    marginBottom: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  followingButton: {},
  followText: {
    fontWeight: '600',
    fontSize: 12,
  },
  followingText: {},
});
