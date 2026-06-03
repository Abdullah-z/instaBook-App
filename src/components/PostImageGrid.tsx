import React from 'react';
import { View, Image, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { addOpacity } from '../utils/colorUtils';

const { width: screenWidth } = Dimensions.get('window');
const GRID_PADDING = 32; // Matches marginHorizontal: 16 in PostCard
const GRID_WIDTH = screenWidth - GRID_PADDING;

interface PostImageGridProps {
  images: any[];
  onImagePress: (index: number) => void;
}

const MediaItem = ({ item, style, isVideo, showOverlay, overlayCount, onPress }: any) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.mediaItemContainer, style]}>
      {isVideo ? (
        <View style={styles.videoWrapper}>
          <Video
            source={{ uri: item.url }}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={false}
            isMuted={true}
          />
          <View style={styles.videoOverlay}>
            <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      ) : (
        <Image source={{ uri: item.url }} style={styles.image} resizeMode="cover" />
      )}

      {showOverlay && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>+{overlayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const SingleImageItem = ({ item, isVideo, onPress }: any) => {
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!isVideo && item?.url) {
      Image.getSize(
        item.url,
        (width, height) => {
          if (width > 0 && height > 0) {
            setAspectRatio(width / height);
          }
        },
        (error) => {
          console.log('Failed to get image size', error);
        }
      );
    }
  }, [item?.url, isVideo]);

  const computedHeight = aspectRatio ? GRID_WIDTH / aspectRatio : 350;
  // Ensure we don't collapse on loading/error, but otherwise let it scale to 100% of its proportional height
  const finalHeight = Math.max(computedHeight, 150);

  return (
    <MediaItem
      item={item}
      isVideo={isVideo}
      onPress={onPress}
      style={{
        width: GRID_WIDTH,
        height: finalHeight,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'center',
      }}
    />
  );
};

const PostImageGrid = ({ images, onImagePress }: PostImageGridProps) => {
  const count = images.length;
  if (count === 0) return null;

  const isItemVideo = (item: any) => item?.resource_type === 'video' || item?.url?.endsWith('.mp4');

  // Layout for 1 image
  if (count === 1) {
    return (
      <SingleImageItem
        item={images[0]}
        isVideo={isItemVideo(images[0])}
        onPress={() => onImagePress(0)}
      />
    );
  }

  // Layout for 2 images
  if (count === 2) {
    return (
      <View style={styles.row}>
        <MediaItem
          item={images[0]}
          isVideo={isItemVideo(images[0])}
          onPress={() => onImagePress(0)}
          style={{
            width: (GRID_WIDTH - 4) / 2,
            height: 300,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />
        <MediaItem
          item={images[1]}
          isVideo={isItemVideo(images[1])}
          onPress={() => onImagePress(1)}
          style={{
            width: (GRID_WIDTH - 4) / 2,
            height: 300,
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
          }}
        />
      </View>
    );
  }

  // Layout for 3 images
  if (count === 3) {
    return (
      <View style={styles.grid}>
        <MediaItem
          item={images[0]}
          isVideo={isItemVideo(images[0])}
          onPress={() => onImagePress(0)}
          style={{
            width: GRID_WIDTH,
            height: 250,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        />
        <View style={[styles.row, { marginTop: 4 }]}>
          <MediaItem
            item={images[1]}
            isVideo={isItemVideo(images[1])}
            onPress={() => onImagePress(1)}
            style={{ width: (GRID_WIDTH - 4) / 2, height: 180, borderBottomLeftRadius: 12 }}
          />
          <MediaItem
            item={images[2]}
            isVideo={isItemVideo(images[2])}
            onPress={() => onImagePress(2)}
            style={{ width: (GRID_WIDTH - 4) / 2, height: 180, borderBottomRightRadius: 12 }}
          />
        </View>
      </View>
    );
  }

  // Layout for 4 images
  if (count === 4) {
    return (
      <View style={styles.grid}>
        <MediaItem
          item={images[0]}
          isVideo={isItemVideo(images[0])}
          onPress={() => onImagePress(0)}
          style={{
            width: GRID_WIDTH,
            height: 250,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        />
        <View style={[styles.row, { marginTop: 4 }]}>
          <MediaItem
            item={images[1]}
            isVideo={isItemVideo(images[1])}
            onPress={() => onImagePress(1)}
            style={{ width: (GRID_WIDTH - 8) / 3, height: 150, borderBottomLeftRadius: 12 }}
          />
          <MediaItem
            item={images[2]}
            isVideo={isItemVideo(images[2])}
            onPress={() => onImagePress(2)}
            style={{ width: (GRID_WIDTH - 8) / 3, height: 150 }}
          />
          <MediaItem
            item={images[3]}
            isVideo={isItemVideo(images[3])}
            onPress={() => onImagePress(3)}
            style={{ width: (GRID_WIDTH - 8) / 3, height: 150, borderBottomRightRadius: 12 }}
          />
        </View>
      </View>
    );
  }

  // Layout for 5+ images (Matches example image: 2 top, 3 bottom)
  return (
    <View style={styles.grid}>
      <View style={[styles.row, { marginBottom: 4 }]}>
        <MediaItem
          item={images[0]}
          isVideo={isItemVideo(images[0])}
          onPress={() => onImagePress(0)}
          style={{ width: (GRID_WIDTH - 4) / 2, height: 220, borderTopLeftRadius: 12 }}
        />
        <MediaItem
          item={images[1]}
          isVideo={isItemVideo(images[1])}
          onPress={() => onImagePress(1)}
          style={{ width: (GRID_WIDTH - 4) / 2, height: 220, borderTopRightRadius: 12 }}
        />
      </View>
      <View style={styles.row}>
        <MediaItem
          item={images[2]}
          isVideo={isItemVideo(images[2])}
          onPress={() => onImagePress(2)}
          style={{ width: (GRID_WIDTH - 8) / 3, height: 150, borderBottomLeftRadius: 12 }}
        />
        <MediaItem
          item={images[3]}
          isVideo={isItemVideo(images[3])}
          onPress={() => onImagePress(3)}
          style={{ width: (GRID_WIDTH - 8) / 3, height: 150 }}
        />
        <MediaItem
          item={images[4]}
          isVideo={isItemVideo(images[4])}
          onPress={() => onImagePress(4)}
          style={{ width: (GRID_WIDTH - 8) / 3, height: 150, borderBottomRightRadius: 12 }}
          showOverlay={count > 5}
          overlayCount={count - 5}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: GRID_WIDTH,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: GRID_WIDTH,
    alignSelf: 'center',
  },
  mediaItemContainer: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
});

export default React.memo(PostImageGrid);
