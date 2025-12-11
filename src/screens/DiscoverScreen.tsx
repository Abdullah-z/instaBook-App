import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { getDiscoverPostsAPI } from '../api/postAPI';
import { AuthContext } from '../auth/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

const DiscoverScreen = () => {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchDiscoverPosts();
  }, []);

  const fetchDiscoverPosts = async () => {
    try {
      setLoading(true);
      const res = await getDiscoverPostsAPI(token || '', page);
      if (res.posts.length < 9) {
        setHasMore(false);
      }
      console.log(res.posts);
      setPosts((prev) => (page === 1 ? res.posts : [...prev, ...res.posts]));
    } catch (error) {
      console.error('Error fetching discover posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchDiscoverPosts();
    }
  }, [page]);

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.images[0]?.url;
    const isVideo = imageUrl?.match(/video/i);

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => {
          // Navigate to post detail if available, or just log for now
          console.log('Pressed post:', item._id);
          navigation.navigate('PostDetail', { post: item._id, postId: item._id });
        }}>
        <Image
          source={{
            uri: isVideo ? 'https://cdn-icons-png.flaticon.com/512/238/238910.png' : imageUrl,
          }}
          style={styles.image}
          resizeMode="cover"
        />
        {isVideo && (
          <View style={styles.videoIndicator}>
            <Text style={styles.videoText}>▶</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && page > 1 ? <ActivityIndicator color="#D4F637" /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    padding: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: 'white',
    fontSize: 10,
  },
});

export default DiscoverScreen;
