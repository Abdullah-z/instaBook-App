import { Image } from 'expo-image';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, Keyboard, Platform, Alert, StyleSheet, TouchableOpacity, Dimensions, Modal as RNModal, TextInput as RNTextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ImageView from 'react-native-image-viewing';
import { downloadAndSaveImage } from '../utils/MediaUtils';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import {
  getPostAPI,
  likePostAPI,
  unlikePostAPI,
  savePost,
  unsavePost,
  deletePostAPI,
  sharePostAPI,
} from '../api/postAPI';
import Toast from 'react-native-toast-message';
import { addCommentAPI, deleteCommentAPI, updateCommentAPI } from '../api/commentAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import useSocketStore from '../store/useSocketStore';
import CommentDisplay from '../components/CommentDisplay';
import InputComment from '../components/InputComment';
import PollView from '../components/PollView';
import { POST_BACKGROUNDS } from '../constants/postTheme';
import { CommentType } from '../types/types';
import { Ionicons } from '@expo/vector-icons';
import HashtagText from '../components/HashtagText';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Avatar, Menu, IconButton, useTheme } from 'react-native-paper';
import moment from 'moment';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';

const screenWidth = Dimensions.get('window').width;

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const PostScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user, isAmbientEnabled } = useContext(AuthContext);
  const { socket } = useSocketStore();
  const theme = useTheme();

  // RECEIVES ONLY POST ID
  const { postId } = route.params;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyComments, setReplyComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingID, setReplyingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Like / Save / Menu State
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const [playVideo, setPlayVideo] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const likeScale = useSharedValue(1);

  const animatedLikeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: likeScale.value }],
    };
  });

  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue(0);

  // Always fetch post by id
  const fetchPost = async () => {
    try {
      if (!postId) return;

      const res = await getPostAPI(postId);
      setPost(res.post);

      // Set initial like/save state
      setLikes(res.post.likes.length);
      if (user) {
        setIsLiked(res.post.likes.some((like: any) => like._id === user._id || like === user._id));
        setIsSaved(user.saved?.includes(res.post._id) || false);
      }

      // Setup comments
      const all = res.post.comments || [];
      setComments(all.filter((c: any) => !c.reply));
      setReplyComments(all.filter((c: any) => c.reply));
    } catch (err) {
      console.error('Failed to fetch post:', err);
      Alert.alert('Error', 'Could not load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const images = Array.isArray(post?.images) ? post.images : [];

  // Reply tree building
  const findRootCommentID = (id: string): string => {
    let root = id;
    let parent = replyComments.find((c) => c._id === root);
    while (parent?.reply) {
      root = parent.reply;
      parent = replyComments.find((c) => c._id === root);
    }
    return root;
  };

  const getNestedReplies = (parentId: string): CommentType[] => {
    const build = (commentId: string): CommentType[] => {
      const children = replyComments.filter((c) => c.reply === commentId);
      return children.map((child) => ({
        ...child,
        children: build(child._id),
      }));
    };
    return build(parentId);
  };

  // Send / Edit Comment
  const handleSend = async () => {
    if (!commentText.trim() || !post) return;

    if (editingID) {
      try {
        await updateCommentAPI(editingID, commentText);
        const update = (list: CommentType[]) =>
          list.map((c) => (c._id === editingID ? { ...c, content: commentText } : c));

        setComments((p) => update(p));
        setReplyComments((p) => update(p));
        setEditingID(null);
        setCommentText('');
      } catch (err) {
        console.error('Failed to edit comment:', err);
      }
      return;
    }

    try {
      const replyId = replyingID ? findRootCommentID(replyingID) : undefined;
      const res = await addCommentAPI(post._id, commentText, replyId);
      const newComment = { ...res.data.newComment, user };

      if (replyId) setReplyComments((p) => [...p, newComment]);
      else setComments((p) => [...p, newComment]);

      setCommentText('');
      setReplyingID(null);
    } catch (err) {
      console.error('Failed to send comment:', err);
    }
  };

  const handleDelete = (comment: CommentType) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommentAPI(comment._id);
            setComments((p) => p.filter((cm) => cm._id !== comment._id));
            setReplyComments((p) => p.filter((cm) => cm._id !== comment._id));
          } catch (err) {
            console.error('Failed to delete comment:', err);
          }
        },
      },
    ]);
  };

  const handleLike = async () => {
    if (isLiked) return handleUnlike();
    setIsLiked(true);
    setLikes((prev) => prev + 1);
    try {
      likeScale.value = withSequence(withSpring(1.5), withSpring(1));
      if (!user) return;
      await likePostAPI(post._id);
      const msg = {
        id: user._id,
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
      setLikes((prev) => prev - 1);
    }
  };

  const handleUnlike = async () => {
    setIsLiked(false);
    setLikes((prev) => prev - 1);
    try {
      likeScale.value = withSequence(withSpring(1.5), withSpring(1));
      if (!user) return;
      await unlikePostAPI(post._id);
      const msg = {
        id: user._id,
        text: 'liked your post.',
        recipients: [post.user._id],
        url: `/post/${post._id}`,
      };
      await removeNotification(msg.id, msg.url);
      socket?.emit('removeNotify', msg);
    } catch (err) {
      console.error('Unlike failed', err);
      setIsLiked(true);
      setLikes((prev) => prev + 1);
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

  const handleShare = async () => {
    if (!post) return;
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

  const handleDeletePost = async () => {
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePostAPI(post._id);
            navigation.goBack();
          } catch (err) {
            console.error('Delete post error:', err);
          }
        },
      },
    ]);
  };


  // Keyboard listeners for input positioning
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // SHOW LOADING
  if (loading || !post) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // AFTER POST LOADED
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={{ paddingTop: 20 }}>
        {/* <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity> */}
        {/* <Text style={styles.headerTitle}>Post</Text> */}
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={() => (
          <View>
            {/* User Info */}

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <View style={styles.headerLeft}>
                {post?.user && (
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('Profile', { id: post.user._id })}>
                    {post.user.avatar &&
                    typeof post.user.avatar === 'string' &&
                    post.user.avatar.trim() !== '' ? (
                      <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
                    ) : (
                      <Avatar.Icon size={40} icon="account" />
                    )}
                  </TouchableOpacity>
                )}
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: theme.colors.onSurface }]}>
                    {post?.user?.username}
                  </Text>
                  <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                    {moment(post.createdAt).fromNow()}
                    {post.isEdited && ' (Edited)'}
                  </Text>
                  {post.address ? (
                    <View style={styles.locationContainer}>
                      <Ionicons
                        name="location-outline"
                        size={11}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>
                        {post.address}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={{ paddingRight: 10 }}>
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
                        handleDeletePost();
                      }}
                      title="Delete"
                      leadingIcon="delete-outline"
                    />
                    <Menu.Item
                      onPress={() => {
                        closeMenu();
                        (navigation as any).navigate('EditPost', {
                          post,
                          onPostUpdate: (updatedPost: any) => setPost(updatedPost),
                        });
                      }}
                      title="Edit"
                      leadingIcon="pencil-outline"
                    />
                  </Menu>
                )}
              </View>
            </View>
            {/* ✅ Post content */}
            {post.background && post.background !== 'default' ? (
              <LinearGradient
                colors={
                  (POST_BACKGROUNDS.find((b) => b.id === post.background)?.colors || [
                    theme.colors.surface,
                    theme.colors.surface,
                  ]) as any
                }
                style={{
                  minHeight: 200,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 20,
                  marginBottom: 10,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}>
                <HashtagText
                  style={{
                    fontSize: post.textStyle?.fontSize || 24,
                    color: post.textStyle?.color || '#FFFFFF',
                    fontWeight: post.textStyle?.fontWeight || 'bold',
                    textAlign: 'center',
                  }}>
                  {post.content}
                </HashtagText>
              </LinearGradient>
            ) : (
              <HashtagText
                style={[
                  styles.content,
                  { paddingHorizontal: 10, marginTop: 10, color: theme.colors.onSurface },
                  post.textStyle && {
                    fontSize: post.textStyle.fontSize,
                    color:
                      post.textStyle.color &&
                      post.textStyle.color !== '#FFFFFF' &&
                      post.textStyle.color !== '#fff' &&
                      post.textStyle.color !== '#000000' &&
                      post.textStyle.color !== '#000' &&
                      !post.textStyle.color.startsWith('rgb(32, 27, 22)')
                        ? post.textStyle.color
                        : theme.colors.onSurface,
                  },
                ]}>
                {post.content}
              </HashtagText>
            )}

            {/* ✅ Poll section */}
            {post.poll_question && (
              <View style={{ paddingHorizontal: 15 }}>
                <PollView
                  postId={post._id}
                  question={post.poll_question}
                  options={post.poll_options}
                  onUpdate={(updatedPost: any) => setPost(updatedPost)}
                />
              </View>
            )}

            {/* Images */}
            {images.length > 0 && (
              <View style={{ alignItems: 'center' }}>
                <Carousel
                  ref={ref}
                  width={screenWidth - 20}
                  height={450}
                  data={images}
                  onProgressChange={progress}
                  scrollAnimationDuration={500}
                  renderItem={({ item }: { item: any }) => {
                    const isVideo = item?.resource_type === 'video' || item?.url?.endsWith('.mp4');

                    if (isVideo) {
                      return (
                        <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
                          <Video
                            source={{ uri: item.url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode={ResizeMode.CONTAIN}
                            useNativeControls
                            isLooping
                          />
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          setViewerIndex(images.indexOf(item));
                          setViewerVisible(true);
                        }}>
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: 20,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                          }}>
                          {/* 🌟 Ambient Background (Conditional) */}
                          {isAmbientEnabled && (
                            <>
                              <Image
                                source={{ uri: item.url }}
                                style={{
                                  ...StyleSheet.absoluteFillObject,
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

                          {/* 🖼️ Main Content */}
                          <Image
                            source={{ uri: item.url }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        </View>
                      </TouchableOpacity>
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
                  <Pagination.Basic
                    progress={progress}
                    data={images}
                    containerStyle={{ gap: 6, marginTop: 10 }}
                    dotStyle={{ backgroundColor: '#ccc', width: 8, height: 8, borderRadius: 4 }}
                    // @ts-ignore
                    dotActiveStyle={{
                      backgroundColor: 'black',
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                    }}
                    onPress={(index) => {
                      ref.current?.scrollTo({ count: index - progress.value, animated: true });
                    }}
                  />
                )}
              </View>
            )}

            {/* YouTube Video Section */}
            {!images.length && post.content && getYoutubeId(post.content) && (
              <View
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  overflow: 'hidden',
                  height: 350,
                  backgroundColor: '#000',
                }}>
                {playVideo ? (
                  <YoutubePlayer
                    height={450}
                    play={true}
                    videoId={getYoutubeId(post.content) || ''}
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
                      source={{
                        uri: `https://img.youtube.com/vi/${getYoutubeId(post.content)}/hqdefault.jpg`,
                      }}
                      style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.8 }}
                      resizeMode="cover"
                    />
                    <Ionicons name="play-circle" size={60} color="#fff" style={{ opacity: 0.9 }} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
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

                <View style={styles.actionButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.actionCount, { color: theme.colors.onSurfaceVariant }]}>
                    {comments.length}
                  </Text>
                </View>

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

              {post.user && user && post.user._id !== user._id && (
                <TouchableOpacity onPress={handleToggleSave} style={styles.iconButton}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={22}
                    color={isSaved ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                borderBottomWidth: 1,
                borderColor: theme.colors.outlineVariant,
                marginVertical: 10,
              }}
            />
          </View>
        )}
        renderItem={({ item }) => (
          <CommentDisplay
            comment={item}
            replies={getNestedReplies(item._id)}
            onReply={(c) => setReplyingID(c._id)}
            onDelete={handleDelete}
            onEdit={(c) => {
              setEditingID(c._id);
              setCommentText(c.content);
            }}
            editingID={editingID}
            replyingID={replyingID}
            commentText={commentText}
            setCommentText={setCommentText}
            onSubmit={handleSend}
            currentUserId={user?._id || ''}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Fixed Input Bar at Bottom */}
      <View
        style={[
          styles.fixedInputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            bottom: keyboardHeight,
          },
        ]}>
        <InputComment
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSend}
          placeholder={
            editingID ? 'Editing...' : replyingID ? 'Replying...' : 'Write a comment...'
          }
          bannerText={editingID ? 'Editing comment...' : replyingID ? 'Replying to comment...' : null}
          onCancelBanner={() => {
            setReplyingID(null);
            setEditingID(null);
            setCommentText('');
          }}
        />
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

      <RNModal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Share Post</Text>
              <IconButton icon="close" onPress={() => setShareModalVisible(false)} />
            </View>
            <RNTextInput
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
    </View>
  );
};

export default PostScreen;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
  userInfo: { marginLeft: 10 },
  username: { fontWeight: 'bold', fontSize: 16 },
  timestampContainer: { flexDirection: 'row', alignItems: 'center' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
  locationContainer: { flexDirection: 'row', alignItems: 'center' },
  locationText: { fontSize: 12, color: '#888', marginLeft: 2, marginTop: 2 },
  dot: { fontSize: 12, color: '#888', marginTop: 2 },
  content: { fontSize: 15, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 300,
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
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
  },
  shareBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedInputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
});
