// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useContext, useRef, useCallback, useMemo, use } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { deletePostAPI, getPostsAPI, getSuggestionsAPI } from '../api/postAPI';
import PostCard from '../components/PostCard';
import StatusBox from '../components/StatusBox';
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import CommentsScreen from './CommentScreen';
import { useNavigation } from '@react-navigation/native';
import CreatePostBox from '../components/CreatePostBox';

const LIMIT = 4;

const HomeScreen = () => {
  const { token } = useContext(AuthContext);
  const [visiblePosts, setVisiblePosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['80%'], []);
  const navigation = useNavigation();

  const openComments = (post: any) => {
    console.log('📣 openComments called for:', post._id);
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
      const merged =
        posts.length >= 4
          ? [...posts.slice(0, 4), { _id: 'suggestions_block' }, ...posts.slice(4)]
          : [...posts];
      setVisiblePosts(merged);
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

  const renderItem = ({ item }: { item: any }) => {
    if (item._id === 'suggestions_block') {
      return (
        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>Suggested Users</Text>
          <FlatList
            data={suggestedUsers}
            horizontal
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: item._id })}>
                <View style={styles.suggestionCard}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <Text style={styles.username}>{item.username}</Text>
                  <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item._id)}>
                    <Text style={styles.followText}>Follow</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      );
    }

    return (
      <PostCard
        post={item}
        onPostUpdate={handlePostUpdate}
        onOpenComments={openComments}
        onDelete={handleDeletePost}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visiblePosts}
        ListHeaderComponent={
          <CreatePostBox
            onPostCreated={(newPost) => setVisiblePosts((prev) => [newPost, ...prev])}
          />
        }
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
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
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMore: {
    marginVertical: 16,
  },

  suggestionContainer: {
    paddingVertical: 10,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  followBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
