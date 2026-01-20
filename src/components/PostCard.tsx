import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Modal as RNModal,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import { likePostAPI, unlikePostAPI, savePost, unsavePost } from '../api/postAPI';
import { createNotification, removeNotification } from '../api/notificationAPI';
import { SocketContext } from '../auth/SocketContext';
import { Avatar, Menu, IconButton } from 'react-native-paper';
import moment from 'moment';
import Carousel, { ICarouselInstance, Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Video, ResizeMode } from 'expo-av';
import { promptSaveImage } from '../utils/MediaUtils';
import { shortenAddress } from '../utils/locationHelper';

const screenWidth = Dimensions.get('window').width;

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVideoThumbnail = (url: string) => {
  if (!url) return null;
  // If it's a Cloudinary URL, we can get a thumbnail by changing the extension to .jpg
  if (url.includes('cloudinary.com')) {
    return url.replace(/\.[^/.]+$/, '.jpg');
  }
  return null;
};

// 🎥 Video Item Component to handle play state
const VideoItem = ({ item }: { item: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadVideo, setLoadVideo] = useState(false);
  const thumbnailUrl = getVideoThumbnail(item.url);

  if (!loadVideo) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setLoadVideo(true)}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {thumbnailUrl && (
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.6 }}
            resizeMode="cover"
          />
        )}
        <Ionicons name="play-circle-outline" size={80} color="rgba(255,255,255,0.9)" />
        {/* <Text style={{ color: '#fff', marginTop: 10, fontWeight: 'bold' }}>Tap to Load Video</Text> */}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Video
        source={{ uri: item.url }}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay={true} // Auto play after loading
        isLooping={false}
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />
      {/* Play Icon Overlay - Hidden when playing */}
      {!isPlaying && (
        <View style={{ position: 'absolute', pointerEvents: 'none' }}>
          <Ionicons name="play-circle-outline" size={64} color="rgba(255,255,255,0.7)" />
        </View>
      )}
    </View>
  );
};

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
  const { socket } = useContext(SocketContext);

  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes.length);
  const [isSaved, setIsSaved] = useState(user?.saved?.includes(post._id) || false);
  const comments = post.comments || [];
  const firstComment = comments.find((c: any) => !c.reply);
  const images = Array.isArray(post.images) ? post.images : [];
  const progress = useSharedValue(0);
  const ref = useRef<ICarouselInstance>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0); // Track active slide for custom pagination
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Extract YouTube ID from content
  const youtubeId = post.content ? getYoutubeId(post.content) : null;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // ... (handlers remain the same)

  const handleLike = async () => {
    // ...
    const newPost = {
      ...post,
      likes: [...post.likes, user],
    };
    setIsLiked(true);
    setLikes((prev: number) => prev + 1);
    onPostUpdate(newPost);

    try {
      await likePostAPI(post._id);

      // Notify
      const msg = {
        id: user?._id || '',
        text: 'liked your post.',
        recipients: [post.user._id],
        url: `/post/${post._id}`, // Mobile might handle URLs differently or rely on screen logic
        content: post.content,
        image: post.images && post.images.length > 0 ? post.images[0].url : '',
      };

      await createNotification(msg);
      socket?.emit('createNotify', msg);
    } catch (err) {
      console.error('Like failed', err);
      setIsLiked(false);
      setLikes((prev: number) => prev - 1);
    }
  };

  const handleUnlike = async () => {
    const newPost = {
      ...post,
      likes: post.likes.filter((l: any) => l._id !== user?._id),
    };
    setIsLiked(false);
    setLikes((prev: number) => prev - 1);
    onPostUpdate(newPost);

    try {
      await unlikePostAPI(post._id);

      // Remove Notify
      const msg = {
        id: user?._id || '',
        text: 'liked your post.',
        recipients: [post.user._id],
        url: `/post/${post._id}`,
      };

      await removeNotification(msg.id, msg.url);
      socket?.emit('removeNotify', msg);
    } catch (err) {
      console.error('Unlike failed', err);
      setIsLiked(true);
      setLikes((prev: number) => prev + 1);
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
      <View style={styles.cardContent}>
        {/* ✅ Avatar + Username */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingTop: 12,
            alignItems: 'center',
          }}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { id: post.user._id })}>
              {post.user.avatar &&
              typeof post.user.avatar === 'string' &&
              post.user.avatar.trim() !== '' ? (
                <Avatar.Image size={40} source={{ uri: post.user.avatar }} />
              ) : (
                <Avatar.Icon size={40} icon="account" />
              )}
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{post.user.username}</Text>
              <View style={styles.timestampContainer}>
                <Text style={styles.timestamp}>{moment(post.createdAt).fromNow()}</Text>
                {post.address ? (
                  <View style={styles.locationContainer}>
                    <Text style={styles.dot}> • </Text>
                    <Ionicons name="location" size={12} color="#65676B" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {shortenAddress(post.address)}
                    </Text>
                  </View>
                ) : null}
              </View>
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

        {/* Media Section: Images OR YouTube Video */}
        {images.length > 0 ? (
          <TouchableWithoutFeedback
            onPress={() => navigation.navigate('PostDetail', { postId: post._id, post })}>
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Carousel
                ref={ref}
                width={screenWidth - 20} // Matches card width (screen - margins)
                height={450}
                data={images}
                enabled={images.length > 1} // Disable swipe if only 1 image
                onSnapToItem={(index) => setActiveSlide(index)} // Update active slide
                scrollAnimationDuration={500}
                renderItem={({ item }: { item: any }) => {
                  const isVideo = item?.resource_type === 'video' || item?.url?.endsWith('.mp4');

                  if (isVideo) {
                    return <VideoItem item={item} />;
                  }

                  return item?.url ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        setViewerIndex(images.indexOf(item));
                        setViewerVisible(true);
                      }}
                      onLongPress={() => promptSaveImage(item.url)}>
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />
                  );
                }}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 1,
                  parallaxScrollingOffset: 0,
                  parallaxAdjacentItemScale: 1,
                }}
                loop={false}
              />
              {images.length > 1 && (
                <View
                  style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 }}>
                  {images.map((_: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() =>
                        ref.current?.scrollTo({ count: index - activeSlide, animated: true })
                      }
                      style={{
                        backgroundColor: activeSlide === index ? 'black' : '#ccc',
                        width: activeSlide === index ? 10 : 8,
                        height: activeSlide === index ? 10 : 8,
                        borderRadius: 5,
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        ) : youtubeId ? (
          <View
            style={{
              marginTop: 10,
              borderRadius: 10,
              overflow: 'hidden',
              height: 240,
              backgroundColor: '#000',
            }}>
            {playVideo ? (
              <YoutubePlayer
                height={240}
                play={true}
                videoId={youtubeId}
                onChangeState={(state: string) => {
                  if (state === 'ended') {
                    setPlayVideo(false);
                  }
                }}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPlayVideo(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
                  style={{ width: '100%', height: '100%', position: 'absolute', opacity: 0.8 }}
                  resizeMode="cover"
                />
                <Ionicons name="play-circle" size={60} color="#fff" style={{ opacity: 0.9 }} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* ✅ Like / Comment / Save */}
        <View style={[styles.actions, { paddingHorizontal: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={isLiked ? handleUnlike : handleLike}>
              <Text style={{ fontSize: 16 }}>{isLiked ? '❤️ Unlike' : '🤍 Like'}</Text>
            </TouchableOpacity>

            <Text style={{ marginLeft: 10 }}>{likes} likes</Text>

            <TouchableOpacity
              onPress={() => onOpenComments(post)}
              style={styles.viewCommentsButton}>
              <Text style={styles.viewCommentsText}>
                💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {post.user?._id !== user?._id && (
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
              console.log('📣 onOpenComments called for post:', post._id);
              onOpenComments(post);
            }}
            style={[styles.commentCard, { paddingHorizontal: 12, paddingBottom: 12 }]}>
            <View style={styles.commentRow}>
              {firstComment.user.avatar &&
              typeof firstComment.user.avatar === 'string' &&
              firstComment.user.avatar.trim() !== '' ? (
                <Avatar.Image size={30} source={{ uri: firstComment.user.avatar }} />
              ) : (
                <Avatar.Icon size={30} icon="account" />
              )}
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

      <ImageView
        images={images.filter((img: any) => img.url).map((img: any) => ({ uri: img.url }))}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
      />
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  card: {
    marginVertical: 10, // Increased margin to prevent visual overlap
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    borderRadius: 16,
    overflow: 'hidden', // Inner container clips the content
    backgroundColor: '#fff', // Ensure solid background to hide anything behind
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ensure spacing
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
    color: '#050505',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 2,
    marginTop: 2,
  },
  dot: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    marginBottom: 10,
    paddingHorizontal: 12, // Added local padding
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
