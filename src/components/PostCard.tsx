import { Image } from 'expo-image';
import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback, Modal as RNModal, TextInput, ActivityIndicator, Alert } from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthContext } from '../auth/AuthContext';
import { likePostAPI, unlikePostAPI, savePost, unsavePost, sharePostAPI } from '../api/postAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import useSocketStore from '../store/useSocketStore';
import { Avatar, Menu, IconButton, useTheme } from 'react-native-paper';
import moment from 'moment';
import Carousel from 'react-native-reanimated-carousel';
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
import { addOpacity } from '../utils/colorUtils';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import PostImageGrid from './PostImageGrid';

const screenWidth = Dimensions.get('window').width;

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const PostCard = React.memo(
  ({
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
    const { user, isAmbientEnabled, isGridViewEnabled } = useContext(AuthContext);
    const { socket } = useSocketStore();

    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(post.likes.length);
    const [isSaved, setIsSaved] = useState(user?.saved?.includes(post._id) || false);
    const comments = post.comments || [];
    const firstComment = comments.find((c: any) => !c.reply);
    const images = Array.isArray(post.images) ? post.images : [];
    const [menuVisible, setMenuVisible] = useState(false);
    const [playVideo, setPlayVideo] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const theme = useTheme();

    const likeScale = useSharedValue(1);

    const animatedLikeStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: likeScale.value }],
      };
    });

    const youtubeId = post.content ? getYoutubeId(post.content) : null;

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    const handleLike = async () => {
      const newPost = {
        ...post,
        likes: [...post.likes, user],
      };
      setIsLiked(true);
      setLikes((prev: number) => prev + 1);
      onPostUpdate(newPost);

      try {
        likeScale.value = withSequence(withSpring(1.5), withSpring(1));
        await likePostAPI(post._id);

        const msg = {
          id: user?._id || '',
          text: 'liked your post.',
          recipients: [post.user._id],
          url: `/post/${post._id}`,
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
        likeScale.value = withSequence(withSpring(1.5), withSpring(1));
        await unlikePostAPI(post._id);

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
        await sharePostAPI(post._id, shareContent);
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
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
        ]}>
        <View style={[styles.cardContent, { backgroundColor: theme.colors.surface }]}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              alignItems: 'center',
            }}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
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
                  paddingVertical: 50,
                  marginBottom: 10,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <HashtagText
                  style={{
                    fontSize: post.textStyle?.fontSize || 24,
                    lineHeight: (post.textStyle?.fontSize || 24) * 1.5,
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
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
              activeOpacity={disableNavigation ? 1 : 0.8}>
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

          {images.length > 0 ? (
            isGridViewEnabled ? (
              <PostImageGrid
                images={images}
                onImagePress={(index) => {
                  setViewerIndex(index);
                  setViewerVisible(true);
                }}
              />
            ) : (
              <View
                style={{
                  width: screenWidth - 20,
                  alignSelf: 'center',
                  height: 400,
                  borderRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: '#000',
                }}>
                <Carousel
                  loop={false}
                  width={screenWidth - 20}
                  height={400}
                  data={images}
                  scrollAnimationDuration={500}
                  renderItem={({ item, index }: any) => {
                    const isVideo = item.resource_type === 'video' || item.url?.endsWith('.mp4');
                    return (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          setViewerIndex(index);
                          setViewerVisible(true);
                        }}
                        style={{ flex: 1 }}>
                        {isVideo ? (
                          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Video
                              source={{ uri: item.url }}
                              style={StyleSheet.absoluteFill}
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={false}
                              isMuted={true}
                            />
                            <View
                              style={{
                                ...StyleSheet.absoluteFillObject,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0,0,0,0.2)',
                              }}>
                              <Ionicons
                                name="play-circle"
                                size={60}
                                color="rgba(255,255,255,0.8)"
                              />
                            </View>
                          </View>
                        ) : (
                          <Image
                            source={{ uri: item.url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
                {images.length > 1 && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                      {images.length} photos
                    </Text>
                  </View>
                )}
              </View>
            )
          ) : youtubeId ? (
            <View
              style={{
                marginTop: 10,
                borderRadius: 10,
                overflow: 'hidden',
                height: 240,
                backgroundColor: '#000',
                marginHorizontal: 16,
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

          {post.sharedPost && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
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

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}
            style={styles.actions}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity
                onPress={isLiked ? handleUnlike : handleLike}
                style={styles.actionButton}>
                <Animated.View style={animatedLikeStyle}>
                  <Ionicons
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isLiked ? theme.colors.error : theme.colors.onSurfaceVariant}
                  />
                </Animated.View>
                <Text style={[styles.actionCount, { color: theme.colors.onSurfaceVariant }]}>
                  {likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onOpenComments(post)} style={styles.actionButton}>
                <Ionicons
                  name="chatbubble-outline"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
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

          {firstComment && (
            <TouchableOpacity
              onPress={() => onOpenComments(post)}
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
                    <Text
                      style={[styles.commentMetaText, { color: theme.colors.onSurfaceVariant }]}>
                      {moment(firstComment.createdAt).fromNow()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <ImageView
          images={images.map((img: any) => ({ uri: img.url }))}
          imageIndex={viewerIndex}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
          onLongPress={(image: any) => promptSaveImage(image.uri)}
        />

        <RNModal
          visible={shareModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setShareModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Share Post
                </Text>
                <IconButton icon="close" onPress={() => setShareModalVisible(false)} />
              </View>
              <TextInput
                placeholder="What's on your mind?"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={shareContent}
                onChangeText={setShareContent}
                style={[
                  styles.shareInput,
                  { color: theme.colors.onSurface, borderColor: theme.colors.outlineVariant },
                ]}
                multiline
              />
              <TouchableOpacity
                onPress={handleShare}
                disabled={isSharing}
                style={[styles.shareBtn, { backgroundColor: theme.colors.primary }]}>
                {isSharing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.shareBtnText}>Share Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 12,
    color: '#666',
  },
  locationText: {
    fontSize: 11,
    marginLeft: 2,
    maxWidth: 120,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  commentCard: {
    marginTop: 4,
  },
  commentRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  commentUsername: {
    fontWeight: '700',
    fontSize: 13,
  },
  commentMeta: {
    flexDirection: 'row',
    marginTop: 4,
  },
  commentMetaText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  shareInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
  },
  shareBtn: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PostCard;
