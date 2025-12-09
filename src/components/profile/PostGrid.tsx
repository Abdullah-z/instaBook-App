import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const imageSize = windowWidth / 3;

interface PostGridProps {
  posts: any[];
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreVisible?: boolean;
}

const PostGrid = ({ posts, onLoadMore, isLoadingMore, loadMoreVisible }: PostGridProps) => {
  if (!posts || posts.length === 0) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>No posts yet</Text>;
  }
  const navigation = useNavigation();

  return (
    <FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('PostDetail', { postId: item._id, post: item })}>
          <Image
            source={{ uri: item.images?.[0]?.url }}
            style={{
              width: imageSize,
              height: imageSize,
              margin: 0.5,
              backgroundColor: '#eee',
            }}
          />
        </TouchableOpacity>
      )}
      ListFooterComponent={() => (
        <View style={{ padding: 20 }}>
          {isLoadingMore ? (
            <ActivityIndicator />
          ) : loadMoreVisible ? (
            <TouchableOpacity
              onPress={onLoadMore}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: '#17a2b8',
                borderRadius: 5,
                alignSelf: 'center',
              }}>
              <Text style={{ color: '#17a2b8', fontWeight: 'bold' }}>Load more.</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    />
  );
};

export default PostGrid;
