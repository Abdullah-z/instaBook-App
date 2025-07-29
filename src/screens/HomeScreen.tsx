import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AuthContext } from '../auth/AuthContext';
import { getPostsAPI } from '../api/postAPI';
import StatusBox from '../components/StatusBox';
import PostCard from '../components/PostCard';

const LIMIT = 4;

const HomeScreen = () => {
  const { token } = useContext(AuthContext);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [visiblePosts, setVisiblePosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadInitialPosts = async () => {
    try {
      if (!token) return;
      const res = await getPostsAPI(1, LIMIT);
      setVisiblePosts(res.posts);
      setPage(1);
    } catch (err) {
      console.log('Error loading posts', err);
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

  useEffect(() => {
    loadInitialPosts();
  }, [token]);

  return (
    <FlatList
      data={visiblePosts}
      ListHeaderComponent={<StatusBox />}
      renderItem={({ item }) => <PostCard post={item} onPostUpdate={handlePostUpdate} />}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
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
});
