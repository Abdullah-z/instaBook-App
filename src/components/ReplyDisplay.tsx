import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
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
  const [replyLikes, setReplyLikes] = useState<string[]>(
    reply.likes.map((u: any) => (typeof u === 'string' ? u : u._id))
  );
  const replyHasLiked = replyLikes.includes(currentUserId);

  const handleReplyLikeToggle = async () => {
    try {
      if (replyHasLiked) {
        await unlikeCommentAPI(reply._id);
        setReplyLikes((prev) => prev.filter((id) => id !== currentUserId));
      } else {
        await likeCommentAPI(reply._id);
        setReplyLikes((prev) => [...prev, currentUserId]);
      }
    } catch (err) {
      console.error('❌ Failed to toggle like on reply:', err);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Image
          source={{ uri: reply.user.avatar }}
          style={{ width: 32, height: 32, borderRadius: 16 }}
        />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={{ fontWeight: 'bold' }}>{reply.user.username}</Text>
          <Text style={{ fontSize: 12, color: 'gray' }}>{moment(reply.createdAt).fromNow()}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity onPress={handleReplyLikeToggle}>
            <Text style={{ fontSize: 20 }}>{replyHasLiked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#888' }}>{replyLikes.length}</Text>
        </View>
      </View>

      <Text style={{ fontSize: 14 }}>{reply.content}</Text>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <TouchableOpacity onPress={() => onReply(reply)}>
          <Text style={{ marginRight: 16, fontSize: 13, color: '#555' }}>Reply</Text>
        </TouchableOpacity>
        {reply.user._id === currentUserId && (
          <>
            <TouchableOpacity onPress={() => onEdit(reply)}>
              <Text style={{ marginRight: 16, fontSize: 13, color: '#555' }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(reply)}>
              <Text style={{ fontSize: 13, color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {(editingID === reply._id || replyingID === reply._id) && (
        <View style={{ marginTop: 8 }}>
          <InputComment
            value={commentText}
            onChange={setCommentText}
            onSubmit={onSubmit}
            placeholder={editingID === reply._id ? 'Edit reply...' : 'Reply...'}
          />
        </View>
      )}
    </View>
  );
};

export default ReplyDisplay;
