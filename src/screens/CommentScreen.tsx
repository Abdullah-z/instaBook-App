import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { AuthContext } from '../auth/AuthContext';
import API from '../api/axios';
import { addCommentAPI, deleteCommentAPI, updateCommentAPI } from '../api/commentAPI';
import CommentDisplay from '../components/CommentDisplay';
import InputComment from '../components/InputComment';
import { CommentType } from '../types/types';

const CommentsScreen = ({ route }: any) => {
  const { post } = route.params;
  const { user } = useContext(AuthContext);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [replyComments, setReplyComments] = useState<CommentType[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [replyingID, setReplyingID] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingID, setEditingID] = useState<string | null>(null);

  console.log('editingID', editingID);
  console.log('commentText', commentText);

  const findRootCommentID = (id: string): string => {
    let root = id;
    let parent = replyComments.find((c) => c._id === root);
    while (parent?.reply) {
      root = parent.reply;
      parent = replyComments.find((c) => c._id === root);
    }
    return root;
  };

  const fetchComments = async () => {
    try {
      const res = await API.get(`/post/${post._id}`);
      const all = res.data.post?.comments || [];

      console.log(JSON.stringify(res.data));

      setComments(all.filter((c: any) => !c.reply));
      setReplyComments(all.filter((c: any) => c.reply));
    } catch (err) {
      console.error('❌ Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const handleSend = async () => {
    if (!commentText.trim()) return;

    // ✍️ If editing, run handleEdit logic
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

    // 🆕 New comment or reply
    try {
      const replyId = replyingID ? findRootCommentID(replyingID) : undefined;
      const res = await addCommentAPI(post._id, commentText, replyId);
      const newCommentData = res?.data?.newComment;

      if (!newCommentData || !newCommentData._id) {
        console.error('❌ Invalid comment response:', res);
        return;
      }

      const newCm = {
        ...newCommentData,
        user,
      };

      if (replyId) {
        setReplyComments((prev) => [...prev, newCm]);
      } else {
        setComments((prev) => [...prev, newCm]);
      }

      setCommentText('');
      setReplyingID(null);
      setIsReplying(false);
    } catch (err) {
      console.error('❌ Failed to comment:', err);
    }
  };

  const handleDelete = async (comment: CommentType) => {
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

  const handleEdit = async () => {
    if (!commentText.trim() || !editingID) return;

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
  };

  // ✅ Get all nested replies under a top-level comment
  const getNestedReplies = (parentId: string): CommentType[] => {
    const buildTree = (commentId: string): CommentType[] => {
      const children = replyComments.filter((c) => c.reply === commentId);
      return children.map((child) => ({
        ...child,
        children: buildTree(child._id), // 👈 recursion
      }));
    };

    return buildTree(parentId);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 12 }}>
        {comments.map((c) => (
          <CommentDisplay
            key={c._id}
            comment={c}
            replies={getNestedReplies(c._id)}
            onReply={(comment) => {
              setIsReplying(true);
              setReplyingID(comment._id);
              setEditingID(null); // cancel editing
              setCommentText('');
            }}
            onDelete={handleDelete}
            onEdit={(comment) => {
              setEditingID(comment._id);
              setReplyingID(null); // cancel reply
              setCommentText(comment.content);
            }}
            editingID={editingID}
            replyingID={replyingID}
            commentText={commentText}
            setCommentText={setCommentText}
            onSubmit={handleSend}
          />
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <InputComment
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSend}
          placeholder="Write a comment..."
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CommentsScreen;
