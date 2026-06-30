import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import moment from 'moment';
import { CommentType } from '../types/types';
import InputComment from './InputComment';
import { Ionicons } from '@expo/vector-icons';
import { likeCommentAPI, unlikeCommentAPI } from '../api/commentAPI';
import ReplyDisplay from './ReplyDisplay';

interface Props {
  comment: CommentType;
  replies?: CommentType[];
  onReply: (c: CommentType) => void;
  onDelete: (c: CommentType) => void;
  onEdit: (c: CommentType) => void;
  editingID: string | null;
  replyingID: string | null;
  commentText: string;
  setCommentText: (t: string) => void;
  onSubmit: () => void;
  currentUserId: string;
}

const CommentDisplay: React.FC<Props> = ({
  comment,
  replies = [],
  onReply,
  onDelete,
  onEdit,
  editingID,
  replyingID,
  commentText,
  setCommentText,
  onSubmit,
  currentUserId,
}) => {
  const theme = useTheme();
  const [showCount, setShowCount] = useState(1);
  const visibleReplies = replies.slice(replies.length - showCount);
  const [mainLikes, setMainLikes] = useState(comment.likes || []);

  const hasLiked = (likes: any[]) =>
    likes.some((u) => (typeof u === 'string' ? u === currentUserId : u._id === currentUserId));

  const handleMainLikeToggle = async () => {
    const liked = hasLiked(mainLikes);
    try {
      if (liked) {
        await unlikeCommentAPI(comment._id);
        setMainLikes((prev) =>
          prev.filter((u: any) =>
            typeof u === 'string' ? u !== currentUserId : u._id !== currentUserId
          )
        );
      } else {
        await likeCommentAPI(comment._id);
        const newUser: any = { _id: currentUserId };
        setMainLikes((prev) => [...prev, newUser]);
      }
    } catch (err) {
      console.error('❌ Failed to toggle like:', err);
    }
  };

  const renderHeader = (c: CommentType, likesArray: any[], onLikeToggle: () => void) => {
    const liked = hasLiked(likesArray);
    return (
      <View style={styles.header}>
        <Image source={{ uri: c.user.avatar }} style={styles.avatar} />
        <View style={[styles.commentBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.username, { color: theme.colors.onSurface }]}>
            {c.user.username}
          </Text>
          <Text style={[styles.content, { color: theme.colors.onSurface }]}>{c.content}</Text>
        </View>
        <View style={styles.likeSection}>
          <TouchableOpacity onPress={onLikeToggle}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={18}
              color={liked ? theme.colors.error : theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          <Text style={[styles.likeCount, { color: theme.colors.onSurfaceVariant }]}>
            {likesArray.length}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.commentContainer}>
      {renderHeader(comment, mainLikes, handleMainLikeToggle)}

      <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
        {moment(comment.createdAt).fromNow()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onReply(comment)}>
          <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>Reply</Text>
        </TouchableOpacity>
        {comment.user._id === currentUserId && (
          <>
            <TouchableOpacity onPress={() => onEdit(comment)}>
              <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(comment)}>
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>


      {/* Replies */}
      {visibleReplies.length > 0 && (
        <View style={[styles.replies, { borderLeftColor: theme.colors.outlineVariant }]}>
          {visibleReplies.map((reply) => (
            <ReplyDisplay
              key={reply._id}
              reply={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              editingID={editingID}
              replyingID={replyingID}
              commentText={commentText}
              setCommentText={setCommentText}
              onSubmit={onSubmit}
            />
          ))}

          {replies.length - showCount > 0 ? (
            <TouchableOpacity onPress={() => setShowCount(showCount + 10)}>
              <Text style={{ color: theme.colors.primary, marginTop: 6 }}>Load more...</Text>
            </TouchableOpacity>
          ) : (
            replies.length > 1 && (
              <TouchableOpacity onPress={() => setShowCount(1)}>
                <Text style={{ color: theme.colors.primary, marginTop: 6 }}>Hide...</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </View>
  );
};

export default CommentDisplay;

const styles = StyleSheet.create({
  commentContainer: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  username: {
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 48,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 48,
    alignItems: 'center',
  },
  actionText: {
    marginRight: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  replies: {
    marginTop: 10,
    marginLeft: 48,
    borderLeftWidth: 1,
    paddingLeft: 12,
  },
  likeSection: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
  },
  heart: {
    fontSize: 16,
  },
  likeCount: {
    fontSize: 10,
    marginTop: 2,
  },
});
