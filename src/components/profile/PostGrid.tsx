import { useNavigation } from '@react-navigation/native';
import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';
import { POST_BACKGROUNDS } from '../../constants/postTheme';
import { Ionicons } from '@expo/vector-icons';

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

const GridItem = React.memo(({ item, index, navigation, imageSize }: any) => {
  const youtubeId = item.content ? getYoutubeId(item.content) : null;
  let isNativeVideo = false;
  let imageUrl = 'https://via.placeholder.com/150';

  const firstImage = item.images?.[0];
  if (firstImage) {
    if (typeof firstImage === 'string') {
      imageUrl = firstImage;
      isNativeVideo = imageUrl.endsWith('.mp4');
    } else {
      imageUrl = firstImage.url;
      isNativeVideo =
        firstImage.resource_type === 'video' || !!(imageUrl && imageUrl.endsWith('.mp4'));
    }

    if (isNativeVideo && imageUrl && imageUrl.includes('cloudinary.com')) {
      imageUrl = imageUrl.replace(/\.[^/.]+$/, '.jpg');
    }
  } else if (youtubeId) {
    imageUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  const isVideo = isNativeVideo || youtubeId;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(400)
        .springify()}>
      <TouchableOpacity
        onPress={() => navigation.navigate('PostDetail', { postId: item._id, post: item })}>
        {!firstImage && !youtubeId ? (
          <LinearGradient
            colors={
              (!item.background || item.background === 'default'
                ? ['#ffffff', '#ffffff']
                : POST_BACKGROUNDS.find((b) => b.id === item.background)?.colors || [
                    '#ccc',
                    '#ccc',
                  ]) as any
            }
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
                color:
                  item.textStyle?.color ||
                  (!item.background || item.background === 'default' ? '#000' : '#fff'),
                fontSize: 10,
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              {item.content}
            </Text>
          </LinearGradient>
        ) : (
          <>
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
                  backgroundColor: 'rgba(0,0,0,0.1)',
                }}>
                <View
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    padding: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}>
                  <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
                </View>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

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
  showPrivateMessage,
}: PostGridProps & { showPrivateMessage?: boolean }) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();

  const renderItem = React.useCallback(
    ({ item, index }: any) => (
      <GridItem item={item} index={index} navigation={navigation} imageSize={imageSize} />
    ),
    [navigation]
  );

  return (
    <Animated.FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      initialNumToRender={12}
      maxToRenderPerBatch={6}
      windowSize={10}
      removeClippedSubviews={Platform.OS === 'android'}
      ListHeaderComponent={ListHeaderComponent}
      onScroll={onScroll}
      contentContainerStyle={contentContainerStyle}
      scrollEnabled={scrollEnabled}
      ListEmptyComponent={() => (
        <View style={{ padding: 40, alignItems: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : showPrivateMessage ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 2,
                  borderColor: theme.colors.outline,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text style={{ fontSize: 30, color: theme.colors.onSurface }}>🔒</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>
                Private Account
              </Text>
              <Text
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 5 }}>
                Follow this account to see their photos and videos.
              </Text>
            </View>
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
