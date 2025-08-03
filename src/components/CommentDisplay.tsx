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
          prev.filter((u) =>
            typeof u === 'string' ? u !== currentUserId : u._id !== currentUserId
          )
        );
      } else {
        await likeCommentAPI(comment._id);
        setMainLikes((prev) => [...prev, { _id: currentUserId }]);
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
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.username}>{c.user.username}</Text>
          <Text style={styles.time}>{moment(c.createdAt).fromNow()}</Text>
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

      <Text style={styles.content}>{comment.content}</Text>

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
              <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
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
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: 'gray',
  },
  content: {
    marginTop: 6,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionText: {
    marginRight: 16,
    fontSize: 13,
    color: '#555',
  },
  replies: {
    marginTop: 12,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#eee',
  },
  replyCard: {
    marginTop: 10,
  },
  likeSection: {
    alignItems: 'center',
  },
  heart: {
    fontSize: 20,
  },
  likeCount: {
    fontSize: 12,
    color: '#888',
  },
});
