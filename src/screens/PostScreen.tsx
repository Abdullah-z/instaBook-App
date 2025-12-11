import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import {
  getPostAPI,
  likePostAPI,
  unlikePostAPI,
  savePost,
  unsavePost,
  deletePostAPI,
} from '../api/postAPI';
import { addCommentAPI, deleteCommentAPI, updateCommentAPI } from '../api/commentAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import { SocketContext } from '../auth/SocketContext';
import CommentDisplay from '../components/CommentDisplay';
import InputComment from '../components/InputComment';
import { CommentType } from '../types/types';
import { Ionicons } from '@expo/vector-icons';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { Avatar, Menu, IconButton } from 'react-native-paper';
import moment from 'moment';
import YoutubePlayer from 'react-native-youtube-iframe';

const screenWidth = Dimensions.get('window').width;

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const PostScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  // RECEIVES ONLY POST ID
  const { postId } = route.params;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyComments, setReplyComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingID, setReplyingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Like / Save / Menu State
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const [playVideo, setPlayVideo] = useState(false);

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
      setIsLiked(res.post.likes.some((like: any) => like._id === user._id || like === user._id));
      setIsSaved(user.saved?.includes(res.post._id));

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

  // SHOW LOADING
  if (loading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  // AFTER POST LOADED
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}>
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
                    onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
                    <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
                  </TouchableOpacity>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{post?.user?.username}</Text>
                  <Text style={styles.timestamp}>{moment(post.createdAt).fromNow()}</Text>
                </View>
              </View>

              <View style={{ paddingRight: 10 }}>
                {post?.user?._id === user?._id && (
                  <Menu
                    visible={menuVisible}
                    onDismiss={closeMenu}
                    anchor={<IconButton icon="dots-vertical" onPress={openMenu} />}>
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
                        navigation.navigate('EditPost', {
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
            <Text style={[styles.content, { paddingHorizontal: 10, marginTop: 10 }]}>
              {post.content}
            </Text>

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
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item.url }}
                      style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                    />
                  )}
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
                  height: 240,
                  backgroundColor: '#000',
                }}>
                {playVideo ? (
                  <YoutubePlayer
                    height={240}
                    play={true}
                    videoId={getYoutubeId(post.content)}
                    onChangeState={(state) => {
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
                <TouchableOpacity onPress={handleLike}>
                  <Text style={{ fontSize: 16 }}>{isLiked ? '❤️ Unlike' : '🤍 Like'}</Text>
                </TouchableOpacity>

                <Text style={{ marginLeft: 10 }}>{likes} likes</Text>

                <Text style={{ marginLeft: 20, fontSize: 14, color: '#555' }}>
                  💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {post.user !== user._id && (
                <TouchableOpacity
                  onPress={handleToggleSave}
                  style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={isSaved ? 'red' : 'black'}
                  />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ borderBottomWidth: 1, borderColor: '#eee', marginVertical: 10 }} />
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
            currentUserId={user._id}
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <InputComment
        value={commentText}
        onChange={setCommentText}
        onSubmit={handleSend}
        placeholder={
          editingID ? 'Update comment...' : replyingID ? 'Reply...' : 'Write a comment...'
        }
        replyTo={replyingID}
        onCancelReply={() => setReplyingID(null)}
      />
    </KeyboardAvoidingView>
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
  timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
  content: { fontSize: 15, marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 15,
  },
});
