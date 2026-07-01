import { Image } from 'expo-image';
import React, { useEffect, useState, useContext, useRef, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { LinearTransition, useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import useSocketStore from '../store/useSocketStore';
import { deletePostAPI, getPostsAPI, getSuggestionsAPI, getStoriesAPI } from '../api/postAPI';
import PostCard from '../components/PostCard';
import StatusBox from '../components/StatusBox';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import CommentsScreen from './CommentScreen';
import { useNavigation } from '@react-navigation/native';
import HeaderLogo from '../components/HeaderLogo';
import SuggestedUsers from '../components/SuggestedUsers';
import WeatherCard from '../components/WeatherCard';
import NewsCard from '../components/NewsCard';
import CryptoCard from '../components/CryptoCard';
import CricketCard from '../components/CricketCard';
import FactCard from '../components/FactCard';
import API from '../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const LIMIT = 4;

const HomeScreen = () => {
  const { token, user } = useContext(AuthContext);
  const { unreadCount } = useSocketStore();
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
  const [news, setNews] = useState<any[]>([]);
  const assignedNews = useRef<Record<string, any>>({});
  const [showWeatherInFeed, setShowWeatherInFeed] = useState(true);
  const [showNewsInFeed, setShowNewsInFeed] = useState(true);
  const [showCryptoInFeed, setShowCryptoInFeed] = useState(false);
  const [showCricketInFeed, setShowCricketInFeed] = useState(false);
  const [showFactInFeed, setShowFactInFeed] = useState(false);

  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [cricketData, setCricketData] = useState<any[]>([]);
  const [factData, setFactData] = useState<any>(null);

  const theme = useTheme();

  // Load preferences from storage each time the screen is focused
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet([
        'weatherInFeedEnabled',
        'newsInFeedEnabled',
        'cryptoInFeedEnabled',
        'cricketInFeedEnabled',
        'factInFeedEnabled',
      ]).then((stores) => {
        stores.forEach(([key, val]) => {
          if (key === 'weatherInFeedEnabled') setShowWeatherInFeed(val === null ? true : val === 'true');
          if (key === 'newsInFeedEnabled') setShowNewsInFeed(val === null ? true : val === 'true');
          if (key === 'cryptoInFeedEnabled') setShowCryptoInFeed(val === 'true');
          if (key === 'cricketInFeedEnabled') setShowCricketInFeed(val === 'true');
          if (key === 'factInFeedEnabled') setShowFactInFeed(val === 'true');
        });
      });
    }, [])
  );

  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const lastScrollY = useSharedValue(0);
  const translateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;
      const diff = currentScrollY - lastScrollY.value;
      
      if (currentScrollY <= 0) {
        translateY.value = 0;
      } else {
        if (diff > 0) {
          translateY.value = Math.max(translateY.value - diff, -100);
        } else if (diff < 0) {
          translateY.value = Math.min(translateY.value - diff, 0);
        }
      }
      lastScrollY.value = currentScrollY;
    },
  });

  const shortcutsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    };
  });

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

      try {
        const [newsRes, cryptoRes, cricketRes, factRes] = await Promise.allSettled([
          API.get('/external/news'),
          API.get('/external/crypto'),
          API.get('/external/cricket'),
          API.get('/external/fact'),
        ]);

        if (newsRes.status === 'fulfilled') setNews(newsRes.value.data.articles || []);
        if (cryptoRes.status === 'fulfilled') setCryptoData(cryptoRes.value.data.coins || []);
        if (cricketRes.status === 'fulfilled') setCricketData(cricketRes.value.data.matches || []);
        if (factRes.status === 'fulfilled') setFactData(factRes.value.data.fact || null);
      } catch (err) {
        console.log('Error fetching external data:', err);
      }
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
        {showWeatherInFeed && <WeatherCard />}
        {showCryptoInFeed && <CryptoCard data={cryptoData} />}
        {showCricketInFeed && <CricketCard data={cricketData} />}
        {showFactInFeed && <FactCard data={factData} />}
      </View>
    ),
    [
      user,
      myStoryData,
      otherStories,
      theme,
      navigation,
      showWeatherInFeed,
      showCryptoInFeed,
      showCricketInFeed,
      showFactInFeed,
      cryptoData,
      cricketData,
      factData,
    ]
  );

  const getNewsForPost = (postId: string, index: number) => {
    if (news.length === 0 || index === 0) return null;
    if (assignedNews.current[postId] !== undefined) {
      return assignedNews.current[postId];
    }
    if (Math.random() < 0.25) {
      const randomNews = news[Math.floor(Math.random() * news.length)];
      assignedNews.current[postId] = randomNews;
      return randomNews;
    }
    assignedNews.current[postId] = null;
    return null;
  };

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const assignedNewsCard = getNewsForPost(item._id, index);
      return (
        <View>
          <PostCard
            post={item}
            onPostUpdate={handlePostUpdate}
            onOpenComments={openComments}
            onDelete={handleDeletePost}
          />
          {showNewsInFeed && assignedNewsCard && (
            <NewsCard article={assignedNewsCard} />
          )}
          {index === 4 && <SuggestedUsers users={suggestedUsers} />}
        </View>
      );
    },
    [handlePostUpdate, openComments, handleDeletePost, suggestedUsers, news, showNewsInFeed]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Screen Specific Shortcuts Row */}
      <Animated.View style={[styles.shortcutsRow, { backgroundColor: theme.colors.surface }, shortcutsAnimatedStyle]}>
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
      </Animated.View>

      <Animated.FlatList
        ref={flatListRef}
        data={visiblePosts}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item: any) => item._id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={loadInitialPosts}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} /> : null}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 20 }}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={(index) => setIsSheetOpen(index >= 0)}
      >
        <BottomSheetView style={{ flex: 1 }}>
          {selectedPost && <CommentsScreen post={selectedPost} />}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  shortcutBtn: {
    padding: 8,
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    marginBottom: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  storyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyUsername: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default HomeScreen;
