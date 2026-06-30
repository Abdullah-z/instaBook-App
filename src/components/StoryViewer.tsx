import { Image } from 'expo-image';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { POST_BACKGROUNDS } from '../constants/postTheme';
import { useNavigation, useRoute } from '@react-navigation/native';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const StoryViewer = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userStories } = route.params as { userStories: any };
  const stories = userStories?.stories || [];
  const user = userStories?.user || userStories?.userStories?.user; // handle inconsistent nesting if any

  // if userStories passed has structure { user: ..., stories: ... } use that.
  // userStories is the item passed from HomeScreen FlatList.

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);
    const firstImg = currentStory.images?.[0];
    const isVideo = firstImg?.type === 'video' || firstImg?.url?.endsWith('.mp4');

    if (isVideo) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = 5000; // 5 seconds per story
    const interval = 50; // update every 50ms
    const step = 1 / (duration / interval);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          // Next story
          nextStory();
          return 1;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex]); // Keep currentIndex as dependency so it resets on change

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      closeViewer();
    }
  };

  const prevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      // Restart or close? usually defaults to restart current or close if first
      setProgress(0);
    }
  };

  const closeViewer = () => {
    navigation.goBack();
  };

  if (!currentStory) return null;

  const firstImg = currentStory.images?.[0];
  const isVideo = firstImg?.type === 'video' || firstImg?.url?.endsWith('.mp4');
  const mediaUrl = firstImg?.url;

  const hasMedia = !!mediaUrl;
  const bgId = currentStory.background || 'default';
  const activeBg = POST_BACKGROUNDS.find((b) => b.id === bgId) || POST_BACKGROUNDS[0];
  const textStyle = currentStory.textStyle || {};

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Media or Styled Text */}
      <View style={styles.mediaContainer}>
        {!hasMedia ? (
          <LinearGradient
            colors={activeBg.colors as any}
            style={[styles.media, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <Text
              style={{
                fontSize: textStyle.fontSize || 24,
                color: textStyle.color || '#000',
                fontWeight: textStyle.fontWeight || 'normal',
                textAlign: 'center',
              }}>
              {currentStory.content}
            </Text>
          </LinearGradient>
        ) : isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded) {
                const duration = status.durationMillis || 1;
                const pos = status.positionMillis;
                setProgress(pos / duration);
                if (status.didJustFinish) {
                  nextStory();
                }
              }
            }}
          />
        ) : (
          <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="cover" />
        )}
      </View>

      {/* Touch overlays for navigation */}
      <View style={styles.touchContainer}>
        <TouchableOpacity style={styles.touchLeft} onPress={prevStory} />
        <TouchableOpacity style={styles.touchRight} onPress={nextStory} />
      </View>

      {/* Progress Bars */}
      <View style={styles.progressContainer}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    index < currentIndex
                      ? '100%'
                      : index === currentIndex
                        ? `${progress * 100}%`
                        : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* User Info */}
      <View style={styles.header}>
        <Image source={{ uri: user?.avatar }} style={styles.avatar} />
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.time}>{moment(currentStory.createdAt).fromNow()}</Text>
      </View>

      {/* Close Button */}
      <TouchableOpacity onPress={closeViewer} style={styles.closeBtn}>
        <Ionicons name="close" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Footer Content - only if media is present */}
      {hasMedia && currentStory.content ? (
        <View style={styles.footer}>
          <Text style={styles.content}>{currentStory.content}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mediaContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: screenWidth,
    height: screenHeight,
  },
  touchContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 0.3,
  },
  touchRight: {
    flex: 0.7,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    height: 3,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 10,
  },
  time: {
    color: '#ddd',
    fontSize: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  content: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

export default StoryViewer;
