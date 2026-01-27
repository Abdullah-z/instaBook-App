import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Animated from 'react-native-reanimated';
import { View, Text, Image, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';
import { POST_BACKGROUNDS } from '../../constants/postTheme';

const windowWidth = Dimensions.get('window').width;
const imageSize = windowWidth / 3;

interface PostGridProps {
  posts: any[];
  onLoadMore?: () => void;
  isLoading?: boolean;
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
  isLoading,
  isLoadingMore,
  loadMoreVisible,
  scrollEnabled = true,
  ListHeaderComponent,
  onScroll,
  contentContainerStyle,
}: PostGridProps) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  return (
    <Animated.FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => {
        const youtubeId = item.content ? getYoutubeId(item.content) : null;
        let isNativeVideo = false;
        let imageUrl = 'https://via.placeholder.com/150';

        if (item.images?.[0]?.url) {
          imageUrl = item.images[0].url;
          isNativeVideo =
            item.images[0].resource_type === 'video' || item.images[0].url.endsWith('.mp4');

          if (isNativeVideo && imageUrl.includes('cloudinary.com')) {
            imageUrl = imageUrl.replace(/\.[^/.]+$/, '.jpg');
          }
        } else if (youtubeId) {
          imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
        }

        if (!item.images?.[0]?.url && !youtubeId) {
          const bgColors =
            item.background && item.background !== 'default'
              ? POST_BACKGROUNDS.find((b) => b.id === item.background)?.colors || ['#ccc', '#ccc']
              : ['#ffffff', '#ffffff'];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('PostDetail', { postId: item._id, post: item })}>
              <LinearGradient
                colors={bgColors as any}
                style={{
                  width: imageSize,
                  height: imageSize,
                  margin: 0.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 8,
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

        const isVideo = isNativeVideo || youtubeId;

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
            {isVideo && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.2)',
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
      ListEmptyComponent={() => (
        <View style={{ padding: 40, alignItems: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              No posts yet
            </Text>
          )}
        </View>
      )}
      ListFooterComponent={() => (
        <View style={{ padding: 20 }}>
          {loadMoreVisible &&
            !isLoading &&
            (isLoadingMore ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <TouchableOpacity
                onPress={onLoadMore}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  borderRadius: 20,
                  alignSelf: 'center',
                }}>
                <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Load more</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}
    />
  );
};

export default PostGrid;
