import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useRoute } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { downloadAndSaveImage } from '../utils/MediaUtils';
import { Ionicons } from '@expo/vector-icons';
import {
  getProfileByUsername,
  getProfileUser,
  getSavedPosts,
  getUserPosts,
} from '../api/profileAPI';
import PostGrid from '../components/profile/PostGrid';
import ProfileHeader from '../components/profile/ProfileHeader';
import { useTheme } from 'react-native-paper';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const HEADER_HEIGHT = 200;
const { width } = Dimensions.get('window');

const ProfileScreen = ({ userId }: { userId?: string }) => {
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);

  const initialId = userId || route.params?.id || route.params?.userId;
  const username = route.params?.username;

  const [id, setId] = useState(initialId || (username ? undefined : user?._id));
  const [profileUser, setProfileUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[] | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'text' | 'saved'>('posts');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedPage, setSavedPage] = useState(1);
  const [savedResult, setSavedResult] = useState(0);

  const [textPosts, setTextPosts] = useState<any[]>([]);
  const [textPage, setTextPage] = useState(1);
  const [textResult, setTextResult] = useState(0);
  const theme = useTheme();

  const [viewerVisible, setViewerVisible] = useState(false);

  const scrollY = useSharedValue(0);

  const loadProfile = async () => {
    const targetId = userId || route.params?.id || route.params?.userId;
    const targetUsername = route.params?.username;

    if (!targetId && !targetUsername && !user?._id) return;

    try {
      setLoading(true);
      let res;
      if (targetId) {
        res = await getProfileUser(targetId);
        setId(targetId);
      } else if (targetUsername) {
        res = await getProfileByUsername(targetUsername);
        setId(res.user._id);
      } else if (user?._id) {
        res = await getProfileUser(user._id as string);
        setId(user._id);
      } else {
        return;
      }

      setProfileUser(res.user);
      setPosts(res.posts);
      setTotalPosts(res.totalPosts);
      setResult(res.result);
      setPage(1);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPosts = async () => {
    try {
      setLoading(true);
      const res = await getSavedPosts(1);
      setSavedPosts(res.savePosts);
      setSavedResult(res.result);
      setSavedPage(1);
    } catch (err) {
      console.error('Failed to fetch saved posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getUserPosts(id, nextPage, 'media');
      setPosts((prev) => [...prev, ...res.posts]);
      setResult(res.result);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleLoadMoreSaved = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = savedPage + 1;
      const res = await getSavedPosts(nextPage);
      setSavedPosts((prev) => [...(prev || []), ...res.savePosts]);
      setSavedResult(res.result);
      setSavedPage(nextPage);
    } catch (err) {
      console.error('Failed to load more saved posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const loadTextPosts = async () => {
    try {
      setLoading(true);
      const res = await getUserPosts(id, 1, 'text');
      setTextPosts(res.posts);
      setTextResult(res.result);
      setTextPage(1);
    } catch (err) {
      console.error('Failed to fetch text posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreText = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = textPage + 1;
      const res = await getUserPosts(id, nextPage, 'text');
      setTextPosts((prev) => [...prev, ...res.posts]);
      setTextResult(res.result);
      setTextPage(nextPage);
    } catch (err) {
      console.error('Failed to load more text posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id, route.params?.id, route.params?.userId, route.params?.username]);

  useEffect(() => {
    if (activeTab === 'saved' && user && id === user._id && !savedPosts) {
      loadSavedPosts();
    } else if (activeTab === 'text' && textPosts.length === 0) {
      loadTextPosts();
    }
  }, [activeTab, id, user, savedPosts, textPosts.length]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / 2, 0, -HEADER_HEIGHT * 0.5],
            'clamp'
          ),
        },
        {
          scale: interpolate(scrollY.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1], 'clamp'),
        },
      ],
    };
  });

  if (loading && !profileUser) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const showLoadMoreButton =
    activeTab === 'saved'
      ? savedResult === 9
      : activeTab === 'text'
        ? textResult === 9
        : result === 9;

  const renderHeader = () => {
    if (!profileUser || !user) return null;
    return (
      <View>
        <ProfileHeader
          profile={profileUser}
          isOwner={id === user._id}
          postCount={totalPosts}
          onRefresh={loadProfile}
          onCoverPress={() => setViewerVisible(true)}
        />

        <View
          style={{
            flexDirection: 'row',
            marginTop: 24,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outlineVariant,
            paddingHorizontal: 10,
          }}>
          {['posts', 'text', 'saved'].map((tab: any) => {
            if (tab === 'saved' && (!user || id !== user._id)) return null;
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  }}>
                  {tab}
                </Text>
                {isActive && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '40%',
                      height: 3,
                      backgroundColor: theme.colors.primary,
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {profileUser && (
        <Animated.Image
          source={{ uri: profileUser.cover || 'https://picsum.photos/800/400' }}
          style={[styles.headerImage, headerAnimatedStyle]}
        />
      )}

      {profileUser && (
        <ImageView
          images={[{ uri: profileUser.cover || 'https://picsum.photos/800/400' }]}
          imageIndex={0}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
          HeaderComponent={() => (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: 20,
                paddingTop: 50,
              }}>
              <TouchableOpacity
                onPress={() =>
                  downloadAndSaveImage(profileUser.cover || 'https://picsum.photos/800/400')
                }
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: 10,
                  borderRadius: 25,
                }}>
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <PostGrid
        posts={activeTab === 'saved' ? savedPosts || [] : activeTab === 'text' ? textPosts : posts}
        onLoadMore={
          activeTab === 'saved'
            ? handleLoadMoreSaved
            : activeTab === 'text'
              ? handleLoadMoreText
              : handleLoadMore
        }
        isLoading={loading}
        isLoadingMore={loadingMore}
        loadMoreVisible={showLoadMoreButton}
        ListHeaderComponent={renderHeader()}
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingTop: 0 }}
        scrollEnabled={true}
        showPrivateMessage={
          profileUser?.isPrivate &&
          user?._id !== id &&
          !profileUser?.followers?.some((f: any) => f._id === user?._id)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    width: width,
    height: HEADER_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
