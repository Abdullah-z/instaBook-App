import React, { useContext, useEffect, useState } from 'react';
import {
  Keyboard,
  Platform,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AuthContext } from '../auth/AuthContext';
import { SocketContext } from '../auth/SocketContext';
import API from '../api/axios';
import { addCommentAPI, deleteCommentAPI, updateCommentAPI } from '../api/commentAPI';
import { createNotification } from '../api/notificationAPI';
import CommentDisplay from '../components/CommentDisplay';
import InputComment from '../components/InputComment';
import { CommentType } from '../types/types';

const CommentsScreen = ({ post }: { post: any }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyComments, setReplyComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyingID, setReplyingID] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/post/${post._id}`);
      const all = res.data.post?.comments || [];
      setComments(all.filter((c: any) => !c.reply));
      setReplyComments(all.filter((c: any) => c.reply));
    } catch (err) {
      console.error('❌ Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

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
        setComments((prev) =>
          prev.map((cm) => (cm._id === editingID ? { ...cm, content: commentText } : cm))
        );
        setReplyComments((prev) =>
          prev.map((cm) => (cm._id === editingID ? { ...cm, content: commentText } : cm))
        );
        setEditingID(null);
        setCommentText('');
      } catch (err) {
        console.error('❌ Failed to edit comment:', err);
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
      setCommentText('');
      setReplyingID(null);

      // Notify
      const msg = {
        id: newComment._id,
        text: newComment.reply ? 'replied to you.' : 'commented on your post.',
        recipients: newComment.reply ? [newComment.tag._id] : [post.user._id],
        url: `/post/${post._id}`,
        content: post.content,
        image: post.images && post.images.length > 0 ? post.images[0].url : '',
      };

      await createNotification(msg);
      socket?.emit('createNotify', msg);
    } catch (err) {
      console.error('❌ Failed to send comment:', err);
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
            console.error('❌ Failed to delete comment:', err);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (post && post._id) fetchComments();
  }, [post]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#888" />
            <Text style={{ marginTop: 10 }}>Loading comments...</Text>
          </View>
        ) : (
          <>
            {/* Scrollable Comment List */}
            <BottomSheetScrollView
              contentContainerStyle={{
                padding: 12,
                // enough room for input
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <InputComment
                value={commentText}
                onChange={setCommentText}
                onSubmit={handleSend}
                placeholder="Write a comment..."
                replyTo={replyingID}
                onCancelReply={() => setReplyingID(null)}
              />
              {comments.map((c) => (
                <CommentDisplay
                  key={c._id}
                  comment={c}
                  replies={getNestedReplies(c._id)}
                  onReply={(comment) => setReplyingID(comment._id)}
                  onDelete={handleDelete}
                  onEdit={(comment) => {
                    setEditingID(comment._id);
                    setCommentText(comment.content);
                  }}
                  editingID={editingID}
                  replyingID={replyingID}
                  commentText={commentText}
                  setCommentText={setCommentText}
                  onSubmit={handleSend}
                  currentUserId={user._id}
                />
              ))}
            </BottomSheetScrollView>

            {/* Fixed Input Bar */}
            {/* <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                borderTopWidth: 1,
                borderColor: '#ddd',
                paddingHorizontal: 10,
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                backgroundColor: '#fff',
              }}>
              <InputComment
                value={commentText}
                onChange={setCommentText}
                onSubmit={handleSend}
                placeholder="Write a comment..."
                replyTo={replyingID}
                onCancelReply={() => setReplyingID(null)}
              />
            </View> */}
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CommentsScreen;
