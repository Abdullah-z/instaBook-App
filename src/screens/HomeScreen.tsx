// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { deletePostAPI, getPostsAPI, getSuggestionsAPI, getStoriesAPI } from '../api/postAPI';
import PostCard from '../components/PostCard';
import StatusBox from '../components/StatusBox';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import CommentsScreen from './CommentScreen';
import { useNavigation } from '@react-navigation/native';
import HeaderLogo from '../components/HeaderLogo';
import SuggestedUsers from '../components/SuggestedUsers';

const LIMIT = 4;

const HomeScreen = () => {
  const { token, user } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext);
  const [visiblePosts, setVisiblePosts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'For You'>('Home');
  const theme = useTheme();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const navigation = useNavigation<any>();

  const loadInitialPosts = useCallback(async () => {
    try {
      if (!token) return;
      setRefreshing(true);
      const res = await getPostsAPI(1, LIMIT);
      const posts = res.posts;

      setVisiblePosts(posts);
      setPage(1);
      setHasMore(posts.length >= LIMIT);

      const suggestRes = await getSuggestionsAPI();
      setSuggestedUsers(suggestRes.users || []);

      const storiesRes = await getStoriesAPI();
      setStories(storiesRes.stories || []);
    } catch (err) {
      console.log('Error loading posts or suggestions:', err);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPostsAPI(nextPage, LIMIT);
      if (res.posts.length > 0) {
        setVisiblePosts((prev) => [...prev, ...res.posts]);
        setPage(nextPage);
        if (res.posts.length < LIMIT) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.log('Error loading more posts', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePostUpdate = useCallback((updatedPost: any) => {
    setVisiblePosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  }, []);

  const openComments = useCallback((post: any) => {
    setSelectedPost(post);
    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(0);
    });
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await deletePostAPI(postId);
      setVisiblePosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('❌ Failed to delete post:', err);
    }
  }, []);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadInitialPosts();
  }, [token]);

  useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const subscription = DeviceEventEmitter.addListener('home_double_tap', () => {
      console.log('📱 Home Screen received double tap event');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      loadInitialPosts();
    });
    return () => subscription.remove();
  }, [loadInitialPosts]);

  // Construct story list: First item is always "Me"
  const myStoryData = stories.find((s) => s.user._id === user?._id);
  const otherStories = stories.filter((s) => s.user._id !== user?._id);

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Stories Bar */}
        <View style={styles.storiesContainer}>
          <FlatList
            data={[
              { _id: 'me', isMe: true, user: user, stories: myStoryData?.stories || [] },
              ...otherStories,
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => (item.isMe ? 'me' : item.user._id)}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => {
              const hasStory = item.stories && item.stories.length > 0;
              const avatarUrl = item.isMe ? user?.avatar : item.user.avatar;
              const username = item.isMe ? 'Your story' : item.user.username;

              return (
                <TouchableOpacity
                  style={styles.storyItem}
                  onPress={() => {
                    // Navigate to story viewer
                    if (hasStory) {
                      navigation.navigate('StoryViewer', { userStories: item });
                    } else if (item.isMe) {
                      navigation.navigate('CreatePostScreen', { initialPostType: 'story' });
                    }
                  }}>
                  <View
                    style={[
                      styles.storyRing,
                      hasStory && { borderColor: theme.colors.primary },
                      !hasStory && { borderColor: theme.colors.outlineVariant },
                    ]}>
                    <Image source={{ uri: avatarUrl }} style={styles.storyAvatar} />
                    {item.isMe && !hasStory && (
                      <View
                        style={[
                          styles.addStoryBadge,
                          {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.surface,
                          },
                        ]}>
                        <Text style={{ color: theme.colors.onPrimary, fontSize: 10 }}>+</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.storyUsername, { color: theme.colors.onSurface }]}
                    numberOfLines={1}>
                    {username}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    ),
    [user, myStoryData, otherStories, theme, navigation]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      return (
        <View>
          <PostCard
            post={item}
            onPostUpdate={handlePostUpdate}
            onOpenComments={openComments}
            onDelete={handleDeletePost}
          />
          {index === 4 && <SuggestedUsers users={suggestedUsers} />}
        </View>
      );
    },
    [handlePostUpdate, openComments, handleDeletePost, suggestedUsers]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Screen Specific Shortcuts Row */}
      <View style={[styles.shortcutsRow, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('Marketplace' as never)}>
          <Ionicons name="storefront-outline" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('Events' as never)}>
          <Ionicons name="calendar-outline" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('Map' as never)}>
          <Ionicons name="map-outline" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => navigation.navigate('Discover' as never)}>
          <Ionicons name="compass-outline" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={visiblePosts}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={loadInitialPosts}
        initialNumToRender={4}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />

      {/* Comments Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.onSurfaceVariant }}
        onChange={(index) => setIsSheetOpen(index >= 0)}>
        <BottomSheetScrollView>
          {isSheetOpen && selectedPost ? (
            <CommentsScreen post={selectedPost} />
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: theme.colors.onSurface }}>Loading...</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};
export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shortcutBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },

  storiesContainer: {
    paddingVertical: 20,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    padding: 3,
    marginBottom: 6,
    overflow: 'hidden', // Ensure image is masked properly
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: 'rgba(0,0,0,0.05)', // Fallback background
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  storyUsername: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },

  loadingMore: {
    marginVertical: 16,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -2,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
