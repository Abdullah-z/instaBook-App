import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { AuthContext } from '../auth/AuthContext';
import useSocketStore from '../store/useSocketStore';
import useLiveStore, { LiveComment, ActiveStream } from '../store/useLiveStore';
import { generateLiveToken } from '../api/liveAPI';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LiveViewerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext);
  const { socket } = useSocketStore();
  const {
    comments, viewerCount,
    startViewing, stopViewing, addComment, loadHistory, setViewerCount,
  } = useLiveStore();

  // stream can come from navigation params (push notification deep-link or discovery)
  const stream: ActiveStream = route.params?.stream;

  const rtcEngineRef = useRef<any>(null);
  const commentsRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [commentText, setCommentText] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [streamEnded, setStreamEnded] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    joinStream();
    return () => cleanupViewer();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket || !stream?.channelName) return;

    // History for late joiners
    socket.on('liveHistory', (data: any) => {
      if (data.channelName === stream.channelName) {
        loadHistory(data.comments);
      }
    });

    socket.on('liveCommentToClient', (data: any) => {
      if (data.channelName === stream.channelName) {
        addComment(data.comment);
      }
    });

    socket.on('liveViewerCountToClient', (data: any) => {
      if (data.channelName === stream.channelName) {
        setViewerCount(data.viewerCount);
      }
    });

    socket.on('liveEndedToClient', (data: any) => {
      if (data.channelName === stream.channelName) {
        setStreamEnded(true);
      }
    });

    // Tell server we joined
    socket.emit('liveJoin', {
      channelName: stream.channelName,
      viewerName: user?.username,
    });

    return () => {
      socket.off('liveHistory');
      socket.off('liveCommentToClient');
      socket.off('liveViewerCountToClient');
      socket.off('liveEndedToClient');
      socket.emit('liveLeave', { channelName: stream.channelName });
    };
  }, [socket, stream?.channelName]);

  // Auto scroll comments
  useEffect(() => {
    if (comments.length > 0) {
      commentsRef.current?.scrollToEnd({ animated: true });
    }
  }, [comments]);

  // Show stream ended alert
  useEffect(() => {
    if (streamEnded) {
      Alert.alert('Stream Ended', `${stream?.hostName} has ended the live stream.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [streamEnded]);

  const joinStream = async () => {
    if (isExpoGo) {
      Alert.alert('Dev Build Required', 'Live streaming requires a development build.');
      navigation.goBack();
      return;
    }

    try {
      const uid = Math.floor(Math.random() * 100000);
      const { token, appId } = await generateLiveToken(stream.channelName, uid, 'subscriber');

      const Agora = require('react-native-agora');
      const engine = Agora.createAgoraRtcEngine();
      engine.initialize({ appId });
      engine.setChannelProfile(Agora.ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(Agora.ClientRoleType.ClientRoleAudience);
      engine.enableVideo();
      engine.enableAudio();

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('✅ Viewer joined channel');
          setIsConnecting(false);
        },
        onUserJoined: (_: any, uid: number) => {
          console.log(`📺 Host stream available: ${uid}`);
          setRemoteUid(uid);
          setIsConnecting(false);
        },
        onUserOffline: (_: any, uid: number) => {
          console.log(`📺 Host went offline: ${uid}`);
          setRemoteUid(null);
        },
        onError: (err: any) => console.error('Agora viewer error:', err),
      });

      engine.joinChannel(token, stream.channelName, uid, {
        publishMicrophoneTrack: false,
        publishCameraTrack: false,
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      });

      rtcEngineRef.current = engine;
      startViewing(stream);
    } catch (err) {
      console.error('Failed to join live stream:', err);
      Alert.alert('Error', 'Could not connect to the live stream.');
      navigation.goBack();
    }
  };

  const cleanupViewer = useCallback(() => {
    if (rtcEngineRef.current) {
      try {
        rtcEngineRef.current.leaveChannel();
        rtcEngineRef.current.disableVideo();
        rtcEngineRef.current.disableAudio();
        rtcEngineRef.current.release();
      } catch (e) {}
      rtcEngineRef.current = null;
    }
    stopViewing();
  }, [stopViewing]);

  const sendComment = () => {
    if (!commentText.trim() || !socket) return;
    const comment: LiveComment = {
      userId: user?._id || '',
      username: user?.username || '',
      avatar: user?.avatar,
      text: commentText.trim(),
      time: new Date().toISOString(),
    };
    socket.emit('liveComment', { channelName: stream.channelName, comment });
    setCommentText('');
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={styles.commentPill}>
      <Text style={styles.commentUsername}>{item.username} </Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  let RtcSurfaceView: any = null;
  if (!isExpoGo) {
    try {
      RtcSurfaceView = require('react-native-agora').RtcSurfaceView;
    } catch (e) {}
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Remote Video */}
      {RtcSurfaceView && remoteUid !== null ? (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: remoteUid, renderMode: 1 }}
          zOrderMediaOverlay={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.connectingBg]}>
          {stream?.hostAvatar ? (
            <Image source={{ uri: stream.hostAvatar }} style={styles.hostAvatarLarge} />
          ) : (
            <MaterialIcons name="account-circle" size={100} color="rgba(255,255,255,0.3)" />
          )}
          <Text style={styles.connectingText}>
            {isConnecting ? 'Connecting...' : `${stream?.hostName}'s video loading`}
          </Text>
        </View>
      )}

      {/* Gradient overlays */}
      <LinearGradient
        colors={['rgba(0,0,0,0.65)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.18, 0.65, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        {/* Host info */}
        <View style={styles.hostInfo}>
          {stream?.hostAvatar ? (
            <Image source={{ uri: stream.hostAvatar }} style={styles.hostAvatar} />
          ) : (
            <MaterialIcons name="account-circle" size={34} color="#fff" />
          )}
          <View>
            <Text style={styles.hostName}>{stream?.hostName}</Text>
            <View style={styles.liveChip}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.topRight}>
          <View style={styles.viewerChip}>
            <Ionicons name="eye-outline" size={14} color="#fff" />
            <Text style={styles.viewerText}>{viewerCount}</Text>
          </View>
          <TouchableOpacity style={styles.leaveBtn} onPress={() => { cleanupViewer(); navigation.goBack(); }}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom: Comments + Input ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSection}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={commentsRef}
          data={comments}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderComment}
          style={styles.commentList}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          pointerEvents="none"
        />

        <View style={styles.commentInputRow}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={sendComment}
              returnKeyType="send"
              maxLength={200}
            />
            {commentText.length > 0 && (
              <TouchableOpacity onPress={sendComment} style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

export default LiveViewerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  connectingBg: {
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  hostAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E53935',
    opacity: 0.6,
  },
  connectingText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 8,
  },
  hostInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hostAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#E53935',
  },
  hostName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontWeight: 'bold', fontSize: 10, letterSpacing: 0.8 },

  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  viewerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  leaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  bottomSection: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  commentList: { maxHeight: height * 0.32, paddingHorizontal: 12 },
  commentPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: width * 0.78,
  },
  commentUsername: { color: '#FFD740', fontWeight: '700', fontSize: 13 },
  commentText: { color: '#fff', fontSize: 13, flexShrink: 1 },

  commentInputRow: { paddingHorizontal: 12, paddingBottom: 10 },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  commentInput: { flex: 1, color: '#fff', fontSize: 14 },
  sendBtn: { marginLeft: 8 },
});
