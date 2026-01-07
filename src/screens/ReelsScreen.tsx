import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getReelsAPI, likePostAPI, unlikePostAPI } from '../api/postAPI';
import { Avatar } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { createNotification, removeNotification } from '../api/notificationAPI';

const { width, height } = Dimensions.get('window');

const LIMIT = 3;

const ReelsScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Fetch Reels
  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await getReelsAPI(1, LIMIT);
      console.log('Reels fetched:', res.posts.length);
      setReels(res.posts);
      setPage(1);
      setHasMore(res.posts.length === LIMIT);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getReelsAPI(nextPage, LIMIT);
      if (res.posts.length > 0) {
        setReels((prev) => [...prev, ...res.posts]);
        setPage(nextPage);
        setHasMore(res.posts.length === LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more reels:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Pause video when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveReelIndex(-1); // Stop playing
      };
    }, [])
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveReelIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Handle Like/Unlike toggle
  const handleToggleLike = async (post: any) => {
    if (!user) return;
    const isLiked = post.likes.some((l: any) => l._id === user._id || l === user._id);

    try {
      if (isLiked) {
        // Unlike
        setReels((prev) =>
          prev.map((r) =>
            r._id === post._id
              ? { ...r, likes: r.likes.filter((l: any) => (l._id || l) !== user._id) }
              : r
          )
        );
        await unlikePostAPI(post._id);

        const msg = {
          id: user._id,
          text: 'liked your post.',
          recipients: [post.user._id],
          url: `/post/${post._id}`,
        };
        await removeNotification(msg.id, msg.url);
        socket?.emit('removeNotify', msg);
      } else {
        // Like
        setReels((prev) =>
          prev.map((r) => (r._id === post._id ? { ...r, likes: [...r.likes, user] } : r))
        );
        await likePostAPI(post._id);

        const msg = {
          id: user._id,
          text: 'liked your post.',
          recipients: [post.user._id],
          url: `/post/${post._id}`,
          content: post.content,
          image: post.images && post.images.length > 0 ? post.images[0].url : '',
        };
        await createNotification(msg);
        socket?.emit('createNotify', msg);
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      // Revert UI on error (simple reload)
      fetchReels();
    }
  };

  // Handle Comments - navigate to post detail
  const handleOpenComments = (post: any) => {
    navigation.navigate('PostDetail', { postId: post._id, post });
  };

  // Handle Share
  const handleShare = async (post: any) => {
    try {
      const shareUrl = `https://yourdomain.com/post/${post._id}`; // Replace with actual domain if available
      const videoUrl =
        post.images.find((img: any) => img.resource_type === 'video' || img.url.endsWith('.mp4'))
          ?.url || '';

      const result = await Share.share({
        message: `${post.content}\n\nCheck out this reel: ${shareUrl}`,
        url: videoUrl || shareUrl,
        title: 'Share Reel',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      console.error('Error sharing reel:', error.message);
    }
  };

  // Render Single Reel
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const isPlaying = index === activeReelIndex;
    const videoUrl =
      item.images.find((img: any) => img.resource_type === 'video' || img.url.endsWith('.mp4'))
        ?.url || '';

    return (
      <View style={[styles.reelContainer, { height: containerHeight }]}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isPlaying}
          isMuted={false}
        />

        {/* Content Overlay */}
        <View style={styles.overlay}>
          {/* Right Side Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleLike(item)}>
              <Ionicons
                name={
                  item.likes.some((l: any) => (l?._id || l) === user?._id)
                    ? 'heart'
                    : 'heart-outline'
                }
                size={35}
                color={
                  item.likes.some((l: any) => (l?._id || l) === user?._id) ? '#ff4757' : '#fff'
                }
              />
              <Text style={styles.actionText}>{item.likes.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComments(item)}>
              <Ionicons name="chatbubble-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>{item.comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
              <Ionicons name="share-social-outline" size={32} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.userInfo}>
              <Avatar.Image
                size={40}
                source={{
                  uri: item.user.avatar || 'https://i.pravatar.cc/150?img=3',
                }}
              />
              <Text style={styles.username}>@{item.user.username}</Text>
            </View>
            <Text style={styles.caption} numberOfLines={2}>
              {item.content}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {containerHeight > 0 && (
        <FlatList
          data={reels}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null
          }
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          getItemLayout={(data, index) => ({
            length: containerHeight,
            offset: containerHeight * index,
            index,
          })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelContainer: {
    width: width,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.1)', // Slight overlay for text readability check
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  rightActions: {
    position: 'absolute',
    right: 10,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 25,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
  bottomInfo: {
    width: '80%',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  caption: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default ReelsScreen;
