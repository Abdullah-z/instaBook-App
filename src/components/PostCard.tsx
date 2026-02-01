import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Modal as RNModal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../auth/AuthContext';
import { likePostAPI, unlikePostAPI, savePost, unsavePost, sharePostAPI } from '../api/postAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import { SocketContext } from '../auth/SocketContext';
import { Avatar, Menu, IconButton, useTheme } from 'react-native-paper';
import moment from 'moment';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Video, ResizeMode } from 'expo-av';
import { promptSaveImage, downloadAndSaveImage } from '../utils/MediaUtils';
import { shortenAddress } from '../utils/locationHelper';
import { POST_BACKGROUNDS } from '../constants/postTheme';
import { LinearGradient } from 'expo-linear-gradient';
import PollView from './PollView';
import HashtagText from './HashtagText';
import { BlurView } from 'expo-blur';

const screenWidth = Dimensions.get('window').width;

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVideoThumbnail = (url: string) => {
  if (!url) return null;
  // If it's a Cloudinary URL, we can get a thumbnail by changing the extension to .jpg
  if (url.includes('cloudinary.com')) {
    return url.replace(/\.[^/.]+$/, '.jpg');
  }
  return null;
};

// 🎥 Video Item Component to handle play state
const VideoItem = ({ item }: { item: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const thumbnailUrl = getVideoThumbnail(item.url);

  if (!loadVideo) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setLoadVideo(true)}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {thumbnailUrl && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.6 }}
            resizeMode="cover"
          />
        )}
        <Ionicons name="play-circle-outline" size={80} color="rgba(255,255,255,0.9)" />
        {/* <Text style={{ color: '#fff', marginTop: 10, fontWeight: 'bold' }}>Tap to Load Video</Text> */}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Video
        source={{ uri: item.url }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay={true} // Auto play after loading
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />
      {/* Play Icon Overlay - Hidden when playing */}
      {!isPlaying && (
        <View style={{ position: 'absolute', pointerEvents: 'none' }}>
          <Ionicons name="play-circle-outline" size={64} color="rgba(255,255,255,0.7)" />
        </View>
      )}
    </View>
  );
};

const PostCard = ({
  post,
  onPostUpdate,
  onOpenComments,
  onDelete,
  disableNavigation,
}: {
  post: any;
  onPostUpdate: (updatedPost: any) => void;
  onOpenComments: (post: any) => void;
  onDelete: (postId: string) => void;
  disableNavigation?: boolean;
}) => {
  const navigation = useNavigation<any>();
  const { user, isAmbientEnabled } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(user?.saved?.includes(post._id) || false);
  const comments = post.comments || [];
  const firstComment = comments.find((c: any) => !c.reply);
  const images = Array.isArray(post.images) ? post.images : [];
  const progress = useSharedValue(0);
  const ref = useRef<ICarouselInstance>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // Track active slide for custom pagination
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const theme = useTheme();

  // Extract YouTube ID from content
  const youtubeId = post.content ? getYoutubeId(post.content) : null;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // ... (handlers remain the same)

  const handleLike = async () => {
    // ...
    const newPost = {
      ...post,
      likes: [...post.likes, user],
    };
    setIsLiked(true);
    setLikes((prev: number) => prev + 1);
    onPostUpdate(newPost);

    try {
      await likePostAPI(post._id);

      // Notify
      const msg = {
        id: user?._id || '',
        text: 'liked your post.',
        recipients: [post.user._id],
        url: `/post/${post._id}`, // Mobile might handle URLs differently or rely on screen logic
        content: post.content,
        image: post.images && post.images.length > 0 ? post.images[0].url : '',
      };

      await createNotification(msg);
      socket?.emit('createNotify', msg);
    } catch (err) {
      console.error('Like failed', err);
      setIsLiked(false);
      setLikes((prev: number) => prev - 1);
    }
  };

  const handleUnlike = async () => {
    const newPost = {
      ...post,
      likes: post.likes.filter((l: any) => l._id !== user?._id),
    };
    setIsLiked(false);
    setLikes((prev: number) => prev - 1);
    onPostUpdate(newPost);

    try {
      await unlikePostAPI(post._id);

      // Remove Notify
      const msg = {
        id: user?._id || '',
        text: 'liked your post.',
        recipients: [post.user._id],
        url: `/post/${post._id}`,
      };

      await removeNotification(msg.id, msg.url);
      socket?.emit('removeNotify', msg);
    } catch (err) {
      console.error('Unlike failed', err);
      setIsLiked(true);
      setLikes((prev: number) => prev + 1);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await unsavePost(post._id);
        setIsSaved(false);
      } else {
        await savePost(post._id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const liked = post.likes.some((like: any) => like._id === user._id || like === user._id);
    setIsLiked(liked);
  }, [post.likes, user]);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await sharePostAPI(post._id, shareContent);
      setShareModalVisible(false);
      setShareContent('');
      Toast.show({
        type: 'success',
        text1: 'Post shared successfully!',
      });
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to share post',
        text2: err.response?.data?.msg || err.message,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}>
      <View style={[styles.cardContent, { backgroundColor: theme.colors.surface }]}>
        {/* ✅ Avatar + Username */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            alignItems: 'center',
          }}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
              {post.user.avatar &&
              typeof post.user.avatar === 'string' &&
              post.user.avatar.trim() !== '' ? (
                <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
              ) : (
                <Avatar.Icon size={40} icon="account" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
              style={styles.userInfo}>
              <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                {post.user.username}
              </Text>
              <View style={styles.timestampContainer}>
                <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                  {moment(post.createdAt).fromNow()}
                  {post.isEdited && ' (Edited)'}
                </Text>
                {post.address ? (
                  <View style={styles.locationContainer}>
                    <Text style={styles.dot}> • </Text>
                    <Ionicons
                      name="location-outline"
                      size={11}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}
                      numberOfLines={1}>
                      {shortenAddress(post.address)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          {post?.user?._id === user?._id && (
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon="dots-horizontal"
                  onPress={openMenu}
                  iconColor={theme.colors.onSurfaceVariant}
                />
              }>
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  Alert.alert(
                    'Delete Post',
                    'Are you sure you want to delete this post? This action cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post._id) },
                    ]
                  );
                }}
                title="Delete"
                leadingIcon="delete-outline"
              />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  navigation.navigate('EditPost', {
                    post,
                    onPostUpdate: (updatedPost: any) => {
                      onPostUpdate(updatedPost);
                    },
                  });
                }}
                title="Edit"
                leadingIcon="pencil-outline"
              />
            </Menu>
          )}
        </View>

        {/* ✅ Post content */}
        {post.background && post.background !== 'default' ? (
          <TouchableOpacity
            onPress={() =>
              !disableNavigation && navigation.navigate('PostDetail', { postId: post._id, post })
            }
            activeOpacity={disableNavigation ? 1 : 0.8}>
            <LinearGradient
              colors={
                (POST_BACKGROUNDS.find((b) => b.id === post.background)?.colors || [
                  theme.colors.surface,
                  theme.colors.surface,
                ]) as any
              }
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 50, // Even more room
                marginBottom: 10,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <HashtagText
                style={{
                  fontSize: post.textStyle?.fontSize || 24,
                  lineHeight: (post.textStyle?.fontSize || 24) * 1.5, // 1.5x line height
                  color: post.textStyle?.color || '#FFFFFF',
                  fontWeight: post.textStyle?.fontWeight || 'bold',
                  textAlign: 'center',
                  includeFontPadding: false,
                  textAlignVertical: 'center',
                }}>
                {post.content}
              </HashtagText>
            </LinearGradient>
          </TouchableOpacity>
        ) : disableNavigation ? (
          <HashtagText
            style={[
              styles.content,
              { color: theme.colors.onSurface },
              post.textStyle && {
                fontSize: post.textStyle.fontSize,
                lineHeight: post.textStyle.fontSize * 1.2,
                color:
                  (post.textStyle.color &&
                    post.textStyle.color !== '#FFFFFF' &&
                    post.textStyle.color !== '#fff' &&
                    post.textStyle.color !== '#000000' &&
                    post.textStyle.color !== '#000' &&
                    !post.textStyle.color.startsWith('rgb(32, 27, 22)') && // Specific fix for the user's report
                    !post.background) ||
                  post.background === 'default'
                    ? post.textStyle.color
                    : theme.colors.onSurface,
              },
            ]}>
            {post.content}
          </HashtagText>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
            <HashtagText
              style={[
                styles.content,
                { color: theme.colors.onSurface },
                post.textStyle && {
                  fontSize: post.textStyle.fontSize,
                  lineHeight: post.textStyle.fontSize * 1.2,
                  color:
                    (post.textStyle.color &&
                      post.textStyle.color !== '#FFFFFF' &&
                      post.textStyle.color !== '#fff' &&
                      post.textStyle.color !== '#000000' &&
                      post.textStyle.color !== '#000' &&
                      !post.textStyle.color.startsWith('rgb(32, 27, 22)') &&
                      !post.background) ||
                    post.background === 'default'
                      ? post.textStyle.color
                      : theme.colors.onSurface,
                },
              ]}>
              {post.content}
            </HashtagText>
          </TouchableOpacity>
        )}

        {/* ✅ Poll section */}
        {post.poll_question && (
          <View style={{ paddingHorizontal: 15 }}>
            <PollView
              postId={post._id}
              question={post.poll_question}
              options={post.poll_options}
              onUpdate={onPostUpdate}
            />
          </View>
        )}

        {/* Media Section: Images OR YouTube Video */}
        {images.length > 0 ? (
          <TouchableWithoutFeedback
            onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Carousel
                ref={ref}
                width={screenWidth - 20} // Matches card width (screen - margins)
                height={450}
                data={images}
                enabled={images.length > 1} // Disable swipe if only 1 image
                onSnapToItem={(index) => setActiveSlide(index)} // Update active slide
                scrollAnimationDuration={500}
                renderItem={({ item }: { item: any }) => {
                  const isVideo = item?.resource_type === 'video' || item?.url?.endsWith('.mp4');

                  if (isVideo) {
                    return (
                      <View
                        style={{
                          borderRadius: 20,
                          overflow: 'hidden',
                          marginHorizontal: 16,
                          marginVertical: 16,
                          borderWidth: 1,
                          borderColor: theme.colors.outlineVariant + '33',
                        }}>
                        <VideoItem item={item} />
                      </View>
                    );
                  }

                  return item?.url ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setViewerIndex(images.indexOf(item));
                        setViewerVisible(true);
                      }}
                      onLongPress={() => promptSaveImage(item.url)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        width: '100%',
                        height: '100%',
                      }}>
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 20,
                          overflow: 'hidden',
                          backgroundColor: '#000',
                          borderWidth: 1,
                          borderColor: theme.colors.outlineVariant + '33',
                        }}>
                        {/* 🌟 Ambient Background (Conditional) */}
                        {isAmbientEnabled && (
                          <>
                            <Image
                              source={{ uri: item.url }}
                              style={{
                                ...StyleSheet.absoluteFillObject,
                                width: '100%',
                                height: '100%',
                                opacity: 1,
                              }}
                              resizeMode="cover"
                            />
                            <BlurView
                              intensity={70}
                              tint="dark"
                              experimentalBlurMethod="dimezisBlurView"
                              style={StyleSheet.absoluteFill}
                            />
                          </>
                        )}

                        {/* 🖼️ Primary Foreground Image */}
                        <Image
                          source={{ uri: item.url }}
                          style={{
                            width: '100%',
                            height: '100%',
                          }}
                          resizeMode="contain"
                        />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#eee',
                        borderRadius: 20,
                        marginHorizontal: 16,
                        marginVertical: 16,
                      }}
                    />
                  );
                }}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 1,
                  parallaxScrollingOffset: 0,
                  parallaxAdjacentItemScale: 1,
                }}
                loop={false}
              />
              {images.length > 1 && (
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
                  {images.map((_: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() =>
                        ref.current?.scrollTo({ count: index - activeSlide, animated: true })
                      }
                      style={{
                        backgroundColor:
                          activeSlide === index ? theme.colors.primary : theme.colors.outline,
                        width: activeSlide === index ? 10 : 8,
                        height: activeSlide === index ? 10 : 8,
                        borderRadius: 5,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        ) : youtubeId ? (
          <View
            style={{
              marginTop: 10,
              borderRadius: 10,
              overflow: 'hidden',
              height: 240,
              backgroundColor: '#000',
            }}>
            {playVideo ? (
              <YoutubePlayer
                height={240}
                play={true}
                videoId={youtubeId}
                onChangeState={(state: string) => {
                  if (state === 'ended') {
                    setPlayVideo(false);
                  }
                }}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPlayVideo(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
                  style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.8 }}
                  resizeMode="cover"
                />
                <Ionicons name="play-circle" size={60} color="#fff" style={{ opacity: 0.9 }} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* ✅ Shared Post Preview */}
        {post.sharedPost && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
              overflow: 'hidden',
              backgroundColor: theme.colors.surfaceVariant + '33',
            }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PostDetail', {
                  postId: post.sharedPost._id,
                  post: post.sharedPost,
                })
              }
              style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {post.sharedPost.user?.avatar &&
                typeof post.sharedPost.user.avatar === 'string' &&
                post.sharedPost.user.avatar.trim() !== '' ? (
                  <Avatar.Image size={24} source={{ uri: post.sharedPost.user.avatar }} />
                ) : (
                  <Avatar.Icon size={24} icon="account" />
                )}
                <Text
                  style={{
                    marginLeft: 8,
                    fontWeight: 'bold',
                    fontSize: 13,
                    color: theme.colors.onSurface,
                  }}>
                  {post.sharedPost.user?.username || 'Unknown User'}
                </Text>
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 11,
                    color: theme.colors.onSurfaceVariant,
                  }}>
                  • {moment(post.sharedPost.createdAt).fromNow()}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: theme.colors.onSurface }} numberOfLines={3}>
                {post.sharedPost.content}
              </Text>
              {post.sharedPost.images &&
                post.sharedPost.images.length > 0 &&
                post.sharedPost.images[0].url && (
                  <Image
                    source={{ uri: post.sharedPost.images[0].url }}
                    style={{
                      width: '100%',
                      height: 150,
                      borderRadius: 12,
                      marginTop: 8,
                      backgroundColor: '#000',
                    }}
                    resizeMode="cover"
                  />
                )}
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ Like / Comment / Save */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
          style={styles.actions}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={isLiked ? handleUnlike : handleLike}
              style={styles.actionButton}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? theme.colors.error : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.actionCount, { color: theme.colors.onSurfaceVariant }]}>
                {likes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onOpenComments(post)} style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.actionCount, { color: theme.colors.onSurfaceVariant }]}>
                {comments.length}
              </Text>
            </TouchableOpacity>

            {!post.sharedPost && (
              <TouchableOpacity
                onPress={() => setShareModalVisible(true)}
                style={styles.actionButton}>
                <Ionicons
                  name="share-social-outline"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={[styles.actionCount, { color: theme.colors.onSurfaceVariant }]}>
                  Share
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {post.user?._id !== user?._id && (
            <TouchableOpacity onPress={handleToggleSave} style={styles.iconButton}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* ✅ One comment preview */}
        {firstComment && (
          <TouchableOpacity
            onPress={() => {
              console.log('📣 onOpenComments called for post:', post._id);
              onOpenComments(post);
            }}
            style={[
              styles.commentCard,
              {
                paddingHorizontal: 12,
                paddingBottom: 12,
                borderTopColor: theme.colors.outlineVariant,
              },
            ]}>
            <View style={styles.commentRow}>
              {firstComment.user.avatar &&
              typeof firstComment.user.avatar === 'string' &&
              firstComment.user.avatar.trim() !== '' ? (
                <Avatar.Image size={30} source={{ uri: firstComment.user.avatar }} />
              ) : (
                <Avatar.Icon size={30} icon="account" />
              )}
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={[styles.commentUsername, { color: theme.colors.onSurface }]}>
                  {firstComment.user.username}
                </Text>
                <Text numberOfLines={1} style={{ color: theme.colors.onSurface }}>
                  {firstComment.content}
                </Text>
                <View style={styles.commentMeta}>
                  <Text style={[styles.commentMetaText, { color: theme.colors.onSurfaceVariant }]}>
                    {moment(firstComment.createdAt).fromNow()}
                  </Text>
                  <Text style={[styles.commentMetaText, { color: theme.colors.onSurfaceVariant }]}>
                    {' '}
                    •{' '}
                  </Text>
                  <Text style={[styles.commentMetaText, { color: theme.colors.onSurfaceVariant }]}>
                    {firstComment.likes.length} like
                    {firstComment.likes.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <ImageView
        images={images.filter((img: any) => img.url).map((img: any) => ({ uri: img.url }))}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        HeaderComponent={({ imageIndex }) => {
          const currentImage = images.filter((img: any) => img.url)[imageIndex];
          return (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: 20,
                paddingTop: 50,
              }}>
              <TouchableOpacity
                onPress={() => currentImage && downloadAndSaveImage(currentImage.url)}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: 10,
                  borderRadius: 25,
                }}>
                <Ionicons name="download-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* ✅ Share Modal */}
      <RNModal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Share Post</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareInputContainer}>
              <Avatar.Image size={40} source={{ uri: user?.avatar }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                  {user?.username}
                </Text>
                <TextInput
                  placeholder="Say something about this..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  multiline
                  value={shareContent}
                  onChangeText={setShareContent}
                  style={{
                    color: theme.colors.onSurface,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    marginTop: 8,
                  }}
                />
              </View>
            </View>

            {/* Original Post Preview in Modal */}
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                padding: 10,
                backgroundColor: theme.colors.surfaceVariant + '22',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Avatar.Image size={20} source={{ uri: post.user?.avatar }} />
                <Text
                  style={{
                    marginLeft: 6,
                    fontWeight: 'bold',
                    fontSize: 12,
                    color: theme.colors.onSurface,
                  }}>
                  {post.user?.username}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.onSurface }} numberOfLines={2}>
                {post.content}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.shareSubmitBtn,
                { backgroundColor: theme.colors.primary },
                isSharing && { opacity: 0.7 },
              ]}
              disabled={isSharing}
              onPress={handleShare}>
              {isSharing ? (
                <ActivityIndicator color={theme.colors.onPrimary} size="small" />
              ) : (
                <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>Share Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>
    </View>
  );
};

export default React.memo(PostCard);

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 28, // Expressive roundness
    borderWidth: 1, // Subtle border
  },
  cardContent: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ensure spacing
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    marginLeft: 2,
    marginTop: 2,
  },
  dot: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  iconButton: {
    padding: 4,
  },
  viewCommentsButton: {
    marginLeft: 20,
  },
  viewCommentsText: {
    fontSize: 14,
  },
  commentCard: {
    paddingTop: 10,
    borderTopWidth: 1,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  commentMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentMetaText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  shareSubmitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
});
