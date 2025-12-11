// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useContext, useRef, useCallback, useMemo, use } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import { deletePostAPI, getPostsAPI, getSuggestionsAPI } from '../api/postAPI';
import PostCard from '../components/PostCard';
import StatusBox from '../components/StatusBox';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import CommentsScreen from './CommentScreen';
import { useNavigation } from '@react-navigation/native';
import CreatePostBox from '../components/CreatePostBox';
import SuggestedUsers from '../components/SuggestedUsers';

const LIMIT = 4;

const HomeScreen = () => {
  const { token } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext);
  const [visiblePosts, setVisiblePosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'For You'>('Home');

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const navigation = useNavigation();

  const openComments = (post: any) => {
    setSelectedPost(post);
    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(0);
    });
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePostAPI(postId);
      setVisiblePosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      console.error('❌ Failed to delete post:', err);
    }
  };

  const loadInitialPosts = async () => {
    try {
      if (!token) return;
      const res = await getPostsAPI(1, LIMIT);
      const posts = res.posts;
      // We don't need to inject suggestions block manually if we have a separate stories/suggestions UI
      setVisiblePosts(posts);
      setPage(1);

      const suggestRes = await getSuggestionsAPI();
      setSuggestedUsers(suggestRes.users || []);
    } catch (err) {
      console.log('Error loading posts or suggestions:', err);
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getPostsAPI(nextPage, LIMIT);
      if (res.posts.length > 0) {
        setVisiblePosts((prev) => [...prev, ...res.posts]);
        setPage(nextPage);
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

  useEffect(() => {
    loadInitialPosts();
  }, [token]);

  const renderHeader = () => (
    <View>
      {/* Stories Bar */}
      {/* <View style={styles.storiesContainer}>
        <FlatList
          data={[
            { _id: 'me', username: 'Your story', avatar: 'https://i.pravatar.cc/150?u=me' },
            ...suggestedUsers,
          ]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={styles.storyItem}>
              <View style={[styles.storyRing, item._id === 'me' && { borderColor: '#ccc' }]}>
                <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
                {item._id === 'me' && (
                  <View style={styles.addStoryBadge}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>+</Text>
                  </View>
                )}
              </View>
              <Text style={styles.storyUsername} numberOfLines={1}>
                {item.username}
              </Text>
            </View>
          )}
        />
      </View> */}

      {/* Tabs */}
      {/* <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('Home')}
          style={[styles.tab, activeTab === 'Home' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'Home' && styles.activeTabText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('For You')}
          style={[styles.tab, activeTab === 'For You' && styles.activeTab]}>
          <Text style={[styles.tabText, activeTab === 'For You' && styles.activeTabText]}>
            For you
          </Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => {
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          {/* <View style={styles.logoBox}>
            <Text style={styles.logoP}>P.</Text>
          </View>
          <Text style={styles.logoText}>Pipel</Text> */}
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Search' as never)}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications' as never)}>
            <View>
              <Ionicons name="notifications" size={24} color="#000" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.iconBtn}>
            <Text>💬</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <FlatList
        data={visiblePosts}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={loadInitialPosts}
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
        onChange={(index) => setIsSheetOpen(index >= 0)}>
        <BottomSheetScrollView>
          {isSheetOpen && selectedPost ? (
            <CommentsScreen post={selectedPost} />
          ) : (
            <View style={{ padding: 20 }}>
              <Text>Loading...</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    backgroundColor: '#D4F637',
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  logoP: { fontWeight: 'bold', fontSize: 14 },
  logoText: { fontWeight: 'bold', fontSize: 18 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  iconBtn: { padding: 4 },

  storiesContainer: {
    paddingVertical: 16,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#D4F637',
    padding: 2,
    marginBottom: 4,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  storyUsername: {
    fontSize: 11,
    color: '#333',
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
