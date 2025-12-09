import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { likePostAPI, unlikePostAPI, savePost, unsavePost } from '../api/postAPI';
import { Avatar, Menu, IconButton } from 'react-native-paper';
import moment from 'moment';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const PostCard = ({
  post,
  onPostUpdate,
  onOpenComments,
  onDelete,
  disableNavigation,
}: {
  post: any;
  onPostUpdate: (updatedPost: any) => void;
  onOpenComments: (post: any) => void;
  onDelete: (postId: string) => void;
  disableNavigation?: boolean;
}) => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  console.log(post?.user);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(user.saved?.includes(post._id));
  const comments = post.comments || [];
  const firstComment = comments.find((c: any) => !c.reply);
  const images = Array.isArray(post.images) ? post.images : [];
  const progress = useSharedValue(0);
  const ref = useRef<ICarouselInstance>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleLike = async () => {
    const newPost = {
      ...post,
      likes: [...post.likes, user],
    };
    setIsLiked(true);
    setLikes((prev) => prev + 1);
    onPostUpdate(newPost);

    try {
      await likePostAPI(post._id);
    } catch (err) {
      console.error('Like failed', err);
      setIsLiked(false);
      setLikes((prev) => prev - 1);
    }
  };

  const handleUnlike = async () => {
    const newPost = {
      ...post,
      likes: post.likes.filter((l: any) => l._id !== user._id),
    };
    setIsLiked(false);
    setLikes((prev) => prev - 1);
    onPostUpdate(newPost);

    try {
      await unlikePostAPI(post._id);
    } catch (err) {
      console.error('Unlike failed', err);
      setIsLiked(true);
      setLikes((prev) => prev + 1);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        await unsavePost(post._id);
        setIsSaved(false);
      } else {
        await savePost(post._id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    const liked = post.likes.some((like: any) => like._id === user._id || like === user._id);
    setIsLiked(liked);
  }, [post.likes, user]);

  return (
    <View style={styles.card}>
      {/* ✅ Avatar + Username */}
      <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
            <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{post.user.username}</Text>

            <Text style={styles.timestamp}>{moment(post.createdAt).fromNow()}</Text>
          </View>
        </View>

        {post?.user?._id === user?._id && (
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={<IconButton icon="dots-vertical" onPress={openMenu} />}>
            <Menu.Item
              onPress={() => {
                closeMenu();
                onDelete(post._id);
              }}
              title="Delete"
              leadingIcon="delete-outline"
            />
            <Menu.Item
              onPress={() => {
                closeMenu();
                navigation.navigate('EditPost', {
                  post,
                  onPostUpdate: (updatedPost: any) => {
                    onPostUpdate(updatedPost);
                  },
                });
              }}
              title="Edit"
              leadingIcon="pencil-outline"
            />
          </Menu>
        )}
      </View>

      {/* ✅ Post content */}
      {disableNavigation ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : (
        <TouchableOpacity
          onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
          <Text style={styles.content}>{post.content}</Text>
        </TouchableOpacity>
      )}

      {images.length > 0 && (
        <TouchableWithoutFeedback
          onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
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
        </TouchableWithoutFeedback>
      )}

      {/* ✅ Like / Comment / Save */}
      <View style={styles.actions}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={isLiked ? handleUnlike : handleLike}>
            <Text style={{ fontSize: 16 }}>{isLiked ? '❤️ Unlike' : '🤍 Like'}</Text>
          </TouchableOpacity>

          <Text style={{ marginLeft: 10 }}>{likes} likes</Text>

          <TouchableOpacity onPress={() => onOpenComments(post)} style={styles.viewCommentsButton}>
            <Text style={styles.viewCommentsText}>
              💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {post.user !== user._id && (
          <TouchableOpacity
            onPress={handleToggleSave}
            style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? 'red' : 'black'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ✅ One comment preview */}
      {firstComment && (
        <TouchableOpacity
          onPress={() => {
            console.log('📣 onOpenComments called for post:', post._id); // ADD THIS
            onOpenComments(post); // This should expand the bottom sheet
          }}
          style={styles.commentCard}>
          <View style={styles.commentRow}>
            <Avatar.Image size={30} source={{ uri: firstComment.user.avatar }} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.commentUsername}>{firstComment.user.username}</Text>
              <Text numberOfLines={1}>{firstComment.content}</Text>
              <View style={styles.commentMeta}>
                <Text style={styles.commentMetaText}>
                  {moment(firstComment.createdAt).fromNow()}
                </Text>
                <Text style={styles.commentMetaText}> • </Text>
                <Text style={styles.commentMetaText}>
                  {firstComment.likes.length} like
                  {firstComment.likes.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PostCard;

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
});
