import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Animated from 'react-native-reanimated';
import { View, Text, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const imageSize = windowWidth / 3;

interface PostGridProps {
  posts: any[];
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreVisible?: boolean;
  scrollEnabled?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  onScroll?: any;
  contentContainerStyle?: any;
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const PostGrid = ({
  posts,
  onLoadMore,
  isLoadingMore,
  loadMoreVisible,
  scrollEnabled = true,
  ListHeaderComponent,
  onScroll,
  contentContainerStyle,
}: PostGridProps) => {
  const navigation = useNavigation<any>();

  return (
    <Animated.FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const youtubeId = item.content ? getYoutubeId(item.content) : null;
        const imageUrl =
          item.images?.[0]?.url ||
          (youtubeId
            ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            : 'https://via.placeholder.com/150');

        return (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: item._id, post: item })}>
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: imageSize,
                height: imageSize,
                margin: 0.5,
                backgroundColor: '#eee',
              }}
            />
            {youtubeId && !item.images?.[0]?.url && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                }}>
                <Text style={{ color: '#fff', fontSize: 24 }}>▶</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
      ListHeaderComponent={ListHeaderComponent}
      onScroll={onScroll}
      contentContainerStyle={contentContainerStyle}
      scrollEnabled={scrollEnabled}
      ListFooterComponent={() => (
        <View style={{ padding: 20 }}>
          {posts && posts.length === 0 && (
            <Text style={{ textAlign: 'center', marginVertical: 20 }}>No posts yet</Text>
          )}
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
