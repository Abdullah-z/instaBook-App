import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Avatar, Text, IconButton, Menu, Card, Button } from 'react-native-paper';
import moment from 'moment';
import { AuthContext } from '../auth/AuthContext';
import { likeCommentAPI, unlikeCommentAPI } from '../api/commentAPI';
import { Ionicons } from '@expo/vector-icons';

interface User {
  _id: string;
  username: string;
  avatar: string;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: User;
  likes: string[];
  reply?: string;
}

interface Props {
  comment: Comment;
  isReply?: boolean;
  onReply?: (comment: Comment) => void;
  onDelete?: (comment: Comment) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  onCommentUpdate?: (updatedComment: Comment) => void;
}

const CommentCard = ({
  comment,
  isReply = false,
  onReply,
  onDelete,
  onEdit,
  onCommentUpdate,
}: Props) => {
  const { user } = useContext(AuthContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = comment.user._id === user._id;
  const [liked, setLiked] = useState(comment.likes.includes(user._id));
  const [likeCount, setLikeCount] = useState(comment.likes.length);

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment._id, editContent.trim());
      setEditing(false);
    }
  };
  const handleLikeToggle = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => prev + (newLiked ? 1 : -1));

    try {
      if (newLiked) {
        await likeCommentAPI(comment._id);
      } else {
        await unlikeCommentAPI(comment._id);
      }
    } catch (err) {
      console.error('❌ Failed to toggle like:', err);
      setLiked(!newLiked); // revert
      setLikeCount((prev) => prev + (newLiked ? -1 : 1));
    }
  };
  return (
    <Card style={[styles.card, isReply && styles.replyCard]}>
      <View style={styles.row}>
        {/* Avatar and main content */}
        <Avatar.Image size={36} source={{ uri: comment.user.avatar }} />

        <View style={styles.content}>
          <Text style={styles.username}>{comment.user.username}</Text>

          {editing ? (
            <>
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                style={styles.input}
                multiline
              />
              <View style={styles.editActions}>
                <Button compact onPress={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button compact onPress={handleSaveEdit}>
                  Save
                </Button>
              </View>
            </>
          ) : (
            <Text>{comment.content}</Text>
          )}

          <View style={styles.actions}>
            <Text style={styles.timestamp}>{moment(comment.createdAt).fromNow()}</Text>
            <Text style={styles.reply} onPress={() => onReply?.(comment)}>
              Reply
            </Text>
          </View>
        </View>

        {/* Like Button on the Right */}
        <View style={styles.likeContainer}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? 'red' : 'gray'}
            onPress={handleLikeToggle}
          />
          <Text style={styles.likeCount}>{likeCount}</Text>
        </View>

        {/* Author Menu */}
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}>
          {isAuthor && (
            <>
              <Menu.Item onPress={() => setEditing(true)} title="Edit" />
              <Menu.Item onPress={() => onDelete?.(comment)} title="Delete" />
            </>
          )}
        </Menu>
      </View>
    </Card>
  );
};

export default CommentCard;

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  replyCard: {
    marginLeft: 32,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
  username: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  timestamp: {
    color: '#888',
  },
  reply: {
    color: 'blue',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    marginTop: 4,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  likeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  likeCount: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
});
