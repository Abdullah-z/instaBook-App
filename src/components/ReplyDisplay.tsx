import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import moment from 'moment';
import { likeCommentAPI, unlikeCommentAPI } from '../api/commentAPI';
import InputComment from './InputComment';
import { CommentType } from '../types/types';

interface Props {
  reply: CommentType;
  currentUserId: string;
  onReply: (c: CommentType) => void;
  onEdit: (c: CommentType) => void;
  onDelete: (c: CommentType) => void;
  editingID: string | null;
  replyingID: string | null;
  commentText: string;
  setCommentText: (t: string) => void;
  onSubmit: () => void;
}

const ReplyDisplay: React.FC<Props> = ({
  reply,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  editingID,
  replyingID,
  commentText,
  setCommentText,
  onSubmit,
}) => {
  const theme = useTheme();
  const [replyLikes, setReplyLikes] = useState<any[]>(reply.likes || []);
  const hasLiked = (likes: any[]) =>
    likes.some((u) => (typeof u === 'string' ? u === currentUserId : u._id === currentUserId));

  const replyHasLiked = hasLiked(replyLikes);

  const handleReplyLikeToggle = async () => {
    try {
      if (replyHasLiked) {
        await unlikeCommentAPI(reply._id);
        setReplyLikes((prev: any[]) =>
          prev.filter((u: any) =>
            typeof u === 'string' ? u !== currentUserId : u._id !== currentUserId
          )
        );
      } else {
        await likeCommentAPI(reply._id);
        setReplyLikes((prev: any[]) => [...prev, { _id: currentUserId }]);
      }
    } catch (err) {
      console.error('❌ Failed to toggle like on reply:', err);
    }
  };

  return (
    <View style={styles.replyContainer}>
      <View style={styles.header}>
        <Image source={{ uri: reply.user.avatar }} style={styles.avatar} />
        <View style={[styles.commentBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.username, { color: theme.colors.onSurface }]}>
            {reply.user.username}
          </Text>
          <Text style={[styles.content, { color: theme.colors.onSurface }]}>{reply.content}</Text>
        </View>
        <View style={styles.likeSection}>
          <TouchableOpacity onPress={handleReplyLikeToggle}>
            <Text style={styles.heart}>{replyHasLiked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <Text style={[styles.likeCount, { color: theme.colors.onSurfaceVariant }]}>
            {replyLikes.length}
          </Text>
        </View>
      </View>

      <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
        {moment(reply.createdAt).fromNow()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onReply(reply)}>
          <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>Reply</Text>
        </TouchableOpacity>
        {reply.user._id === currentUserId && (
          <>
            <TouchableOpacity onPress={() => onEdit(reply)}>
              <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(reply)}>
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {(editingID === reply._id || replyingID === reply._id) && (
        <View style={{ marginTop: 10 }}>
          <InputComment
            value={commentText}
            onChange={setCommentText}
            onSubmit={onSubmit}
            placeholder={editingID === reply._id ? 'Editing reply...' : 'Replying...'}
            onCancelReply={() => {
              setCommentText('');
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  replyContainer: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#F2F3F5',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  username: {
    fontWeight: '700',
    fontSize: 12,
    color: '#000',
    marginBottom: 2,
  },
  content: {
    fontSize: 13,
    color: '#1C1E21',
    lineHeight: 16,
  },
  time: {
    fontSize: 10,
    color: '#65676B',
    marginTop: 2,
    marginLeft: 38,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 2,
    marginLeft: 38,
    alignItems: 'center',
  },
  actionText: {
    marginRight: 16,
    fontSize: 11,
    fontWeight: '600',
    color: '#65676B',
  },
  likeSection: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  heart: {
    fontSize: 14,
  },
  likeCount: {
    fontSize: 9,
    color: '#888',
    marginTop: 1,
  },
});

export default ReplyDisplay;
