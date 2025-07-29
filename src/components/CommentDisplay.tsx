import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput } from 'react-native';
import moment from 'moment';
import { CommentType } from '../types/types';

interface Props {
  comment: CommentType;
  replies?: CommentType[];
  onReply: (c: CommentType) => void;
  onDelete: (c: CommentType) => void;
  onEdit: (comment: CommentType) => void; // ✅ FIXED — now receives full comment
}

const CommentDisplay: React.FC<Props> = ({ comment, replies = [], onReply, onDelete, onEdit }) => {
  const [showCount, setShowCount] = useState(1);

  const visibleReplies = replies.slice(replies.length - showCount);

  return (
    <View style={styles.commentContainer}>
      {/* Comment Card */}
      <View style={styles.header}>
        <Image source={{ uri: comment.user.avatar }} style={styles.avatar} />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.username}>{comment.user.username}</Text>
          <Text style={styles.time}>{moment(comment.createdAt).fromNow()}</Text>
        </View>
      </View>

      <Text style={styles.content}>{comment.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onReply(comment)}>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onEdit(comment)}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(comment)}>
          <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Replies (1-level only, not nested) */}
      {visibleReplies.length > 0 && (
        <View style={styles.replies}>
          {visibleReplies.map((reply) => (
            <View key={reply._id} style={styles.replyCard}>
              <View style={styles.header}>
                <Image source={{ uri: reply.user.avatar }} style={styles.avatar} />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.username}>{reply.user.username}</Text>
                  <Text style={styles.time}>{moment(reply.createdAt).fromNow()}</Text>
                </View>
              </View>
              <Text style={styles.content}>{reply.content}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => onReply(reply)}>
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onEdit(reply)}>
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(reply)}>
                  <Text style={[styles.actionText, { color: 'red' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  editInput: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    padding: 4,
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
});

export default CommentDisplay;
