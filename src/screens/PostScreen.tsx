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
import { getPostAPI, likePostAPI, unlikePostAPI, savePost, unsavePost } from '../api/postAPI';
import { addCommentAPI, deleteCommentAPI, updateCommentAPI } from '../api/commentAPI';
import PostCard from '../components/PostCard';
import CommentDisplay from '../components/CommentDisplay';
import InputComment from '../components/InputComment';
import { CommentType } from '../types/types';
import { Ionicons } from '@expo/vector-icons';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { Avatar } from 'react-native-paper';
import moment from 'moment';
const screenWidth = Dimensions.get('window').width;
const PostScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { postId, post: initialPost } = route.params;

  const [post, setPost] = useState<any>(initialPost || null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyComments, setReplyComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingID, setReplyingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialPost);
  const ref = useRef<ICarouselInstance>(null);
  const images = Array.isArray(post.images) ? post.images : [];
  console.log(post);
  const progress = useSharedValue(0);
  const fetchPost = async () => {
    try {
      const id = postId || post?._id;
      if (!id) return;
      const res = await getPostAPI(id);
      setPost(res.post);

      // Setup comments
      const allMessages = res.post.comments || [];
      setComments(allMessages.filter((c: any) => !c.reply));
      setReplyComments(allMessages.filter((c: any) => c.reply));
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
    const buildTree = (commentId: string): CommentType[] => {
      const children = replyComments.filter((c) => c.reply === commentId);
      return children.map((child) => ({
        ...child,
        children: buildTree(child._id),
      }));
    };
    return buildTree(parentId);
  };

  const handleSend = async () => {
    if (!commentText.trim()) return;

    if (editingID) {
      try {
        await updateCommentAPI(editingID, commentText);
        // Optimistic update
        const updateList = (list: CommentType[]) =>
          list.map((c) => (c._id === editingID ? { ...c, content: commentText } : c));

        setComments((prev) => updateList(prev));
        setReplyComments((prev) => updateList(prev));
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

      if (replyId) {
        setReplyComments((prev) => [...prev, newComment]);
      } else {
        setComments((prev) => [...prev, newComment]);
      }

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
            setComments((prev) => prev.filter((cm) => cm._id !== comment._id));
            setReplyComments((prev) => prev.filter((cm) => cm._id !== comment._id));
          } catch (err) {
            console.error('Failed to delete comment:', err);
          }
        },
      },
    ]);
  };

  if (loading || !post) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4F637" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
          <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{post.user.username}</Text>

          <Text style={styles.timestamp}>{moment(post.createdAt).fromNow()}</Text>
          <Text style={styles.content}>{post.content}</Text>
        </View>
      </View>

      {post?.images.length > 0 && (
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

      <FlatList
        data={comments}
        keyExtractor={(item) => item._id}
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
          editingID ? 'Update comment...' : replyingID ? 'Write a reply...' : 'Write a comment...'
        }
        replyTo={replyingID}
        onCancelReply={() => setReplyingID(null)}
      />
    </KeyboardAvoidingView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ensure spacing
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userInfo: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  viewCommentsButton: {
    marginLeft: 20,
  },
  viewCommentsText: {
    fontSize: 14,
    color: '#555',
  },
  commentCard: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
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
    color: '#888',
  },

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
