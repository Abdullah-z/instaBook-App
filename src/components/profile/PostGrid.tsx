import React from 'react';
import { View, Text, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const imageSize = windowWidth / 3;

const PostGrid = ({ posts }: { posts: any[] }) => {
  if (!posts || posts.length === 0) {
    return <Text style={{ textAlign: 'center', marginTop: 20 }}>No posts yet</Text>;
  }

  return (
    <FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <TouchableOpacity>
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
    />
  );
};

export default PostGrid;
