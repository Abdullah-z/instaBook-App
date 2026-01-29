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
import { useTheme } from 'react-native-paper';
import { getDiscoverPostsAPI } from '../api/postAPI';
import { AuthContext } from '../auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { POST_BACKGROUNDS } from '../constants/postTheme';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;

const DiscoverScreen = () => {
  const { token } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const theme = useTheme();
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
    let imageUrl = item.images[0]?.url;
    let isVideo =
      item.images[0]?.resource_type === 'video' || (imageUrl && imageUrl.endsWith('.mp4'));

    if (imageUrl) {
      if (isVideo && imageUrl.includes('cloudinary.com')) {
        // Create thumbnail from video URL
        imageUrl = imageUrl.replace(/\.[^/.]+$/, '.jpg');
      }

      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => {
            navigation.navigate('PostDetail', { post: item._id, postId: item._id });
          }}>
          <Image
            source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
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
    } else {
      // Text Post
      const bgColors =
        item.background && item.background !== 'default'
          ? POST_BACKGROUNDS.find((b) => b.id === item.background)?.colors || ['#ccc', '#ccc']
          : ['#ffffff', '#ffffff'];

      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => {
            navigation.navigate('PostDetail', { post: item._id, postId: item._id });
          }}>
          <LinearGradient
            colors={bgColors as any}
            style={{
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 5,
            }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text
              numberOfLines={4}
              style={{
                color: item.textStyle?.color || '#fff',
                fontSize: 10,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              {item.content}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
  };

  if (loading && page === 1) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={3}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? <ActivityIndicator color={theme.colors.primary} /> : null
        }
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
