import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import moment from 'moment';
import { CommentType } from '../types/types';
import InputComment from './InputComment';
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
        <View style={styles.commentBubble}>
          <Text style={styles.username}>{c.user.username}</Text>
          <Text style={styles.content}>{c.content}</Text>
        </View>
        <View style={styles.likeSection}>
          <TouchableOpacity onPress={onLikeToggle}>
            <Text style={styles.heart}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <Text style={styles.likeCount}>{likesArray.length}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.commentContainer}>
      {renderHeader(comment, mainLikes, handleMainLikeToggle)}

      <Text style={styles.time}>{moment(comment.createdAt).fromNow()}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onReply(comment)}>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        {comment.user._id === currentUserId && (
          <>
            <TouchableOpacity onPress={() => onEdit(comment)}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(comment)}>
              <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {(editingID === comment._id || replyingID === comment._id) && (
        <View style={{ marginTop: 8 }}>
          <InputComment
            value={commentText}
            onChange={setCommentText}
            onSubmit={onSubmit}
            placeholder={editingID === comment._id ? 'Edit comment...' : 'Reply...'}
          />
        </View>
      )}

      {/* Replies */}
      {visibleReplies.length > 0 && (
        <View style={styles.replies}>
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
              <Text style={{ color: 'crimson', marginTop: 6 }}>Load more...</Text>
            </TouchableOpacity>
          ) : (
            replies.length > 1 && (
              <TouchableOpacity onPress={() => setShowCount(1)}>
                <Text style={{ color: 'crimson', marginTop: 6 }}>Hide...</Text>
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
    backgroundColor: '#eee',
  },
  commentBubble: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: '#F2F3F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  username: {
    fontWeight: '700',
    fontSize: 13,
    color: '#000',
    marginBottom: 2,
  },
  content: {
    fontSize: 14,
    color: '#1C1E21',
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: '#65676B',
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
    color: '#65676B',
  },
  replies: {
    marginTop: 10,
    marginLeft: 48,
    borderLeftWidth: 1,
    borderLeftColor: '#E4E6EB',
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
    color: '#888',
    marginTop: 2,
  },
});
