import React, { useEffect, useState, useContext, useCallback } from 'react';
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
import { getPostsAPI, getSuggestionsAPI } from '../api/postAPI';
import StatusBox from '../components/StatusBox';
import PostCard from '../components/PostCard';
import { followUserAPI } from '../api/profileAPI';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

const LIMIT = 4;

const HomeScreen = () => {
  const { token } = useContext(AuthContext);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [visiblePosts, setVisiblePosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const loadInitialPosts = async () => {
    try {
      if (!token) return;
      setLoading(true);

      const res = await getPostsAPI(1, LIMIT);
      const posts = res.posts;

      let merged = [...posts];
      if (posts.length >= 4) {
        merged.splice(4, 0, { _id: 'suggestions_block' });
      }

      setVisiblePosts(merged);
      setPage(1);

      const suggestRes = await getSuggestionsAPI();
      setSuggestedUsers(suggestRes.users || []);
    } catch (err) {
      console.log('Error loading posts or suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    try {
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
    setVisiblePosts((prevPosts) =>
      prevPosts.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );

    setAllPosts((prevAll) => prevAll.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialPosts(); // reload first page
    } catch (err) {
      console.log('Error refreshing posts', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await followUserAPI(userId);
      // optionally remove from suggested list
      setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('Failed to follow user:', err);
    }
  };

  const renderItem = ({ item }) => {
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
              <View style={styles.suggestionCard}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <Text style={styles.username}>{item.username}</Text>
                <TouchableOpacity style={styles.followBtn} onPress={() => handleFollow(item._id)}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      );
    }

    return <PostCard post={item} onPostUpdate={handlePostUpdate} />;
  };

  useEffect(() => {
    loadInitialPosts();
  }, [token]);

  return (
    <BottomSheetModalProvider>
      <FlatList
        data={visiblePosts}
        ListHeaderComponent={<StatusBox />}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.container}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </BottomSheetModalProvider>
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
