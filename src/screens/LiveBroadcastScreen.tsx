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
  PermissionsAndroid,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { AuthContext } from '../auth/AuthContext';
import useSocketStore from '../store/useSocketStore';
import useLiveStore, { LiveComment } from '../store/useLiveStore';
import { generateLiveToken } from '../api/liveAPI';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const AGORA_APP_ID = '57f1b0fb4940493faf15457d2388d722';

const LiveBroadcastScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { socket } = useSocketStore();
  const {
    isLive, liveChannelName, liveDuration, comments, viewerCount,
    startLive, endLive, addComment, loadHistory, setViewerCount, incrementDuration,
  } = useLiveStore();

  const rtcEngineRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentsRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [channelName] = useState(`live_${user?._id}_${Date.now()}`);

  const isExpoGo = Constants.appOwnership === 'expo';

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Start live on mount
  useEffect(() => {
    initAndGoLive();
    return () => {
      cleanupLive();
    };
  }, []);

  // Socket listeners for viewers
  useEffect(() => {
    if (!socket || !liveChannelName) return;

    socket.on('liveCommentToClient', (data: any) => {
      if (data.channelName === liveChannelName) {
        addComment(data.comment);
      }
    });

    socket.on('liveViewerCountToClient', (data: any) => {
      if (data.channelName === liveChannelName) {
        setViewerCount(data.viewerCount);
      }
    });

    return () => {
      socket.off('liveCommentToClient');
      socket.off('liveViewerCountToClient');
    };
  }, [socket, liveChannelName]);

  // Auto scroll comments
  useEffect(() => {
    if (comments.length > 0) {
      commentsRef.current?.scrollToEnd({ animated: true });
    }
  }, [comments]);

  const initAndGoLive = async () => {
    if (isExpoGo) {
      Alert.alert('Dev Build Required', 'Live streaming requires a development build (not Expo Go).');
      navigation.goBack();
      return;
    }

    setIsStarting(true);
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        const { PermissionsAndroid: PA } = require('react-native');
        await PA.requestMultiple([PA.PERMISSIONS.RECORD_AUDIO, PA.PERMISSIONS.CAMERA]);
      }

      // Fetch token
      const uid = Math.floor(Math.random() * 100000);
      const { token, appId } = await generateLiveToken(channelName, uid, 'publisher');

      // Init Agora in LIVE BROADCASTING mode
      const Agora = require('react-native-agora');
      const engine = Agora.createAgoraRtcEngine();
      engine.initialize({ appId });
      engine.setChannelProfile(Agora.ChannelProfileType.ChannelProfileLiveBroadcasting);
      engine.setClientRole(Agora.ClientRoleType.ClientRoleBroadcaster);
      engine.enableVideo();
      engine.enableAudio();
      engine.startPreview();

      engine.registerEventHandler({
        onJoinChannelSuccess: () => console.log('✅ Host joined live channel'),
        onUserJoined: (_: any, uid: number) => console.log(`👁️ Viewer joined: ${uid}`),
        onUserOffline: (_: any, uid: number) => console.log(`👁️ Viewer left: ${uid}`),
        onError: (err: any) => console.error('Agora error:', err),
      });

      engine.joinChannel(token, channelName, uid, {
        publishMicrophoneTrack: true,
        publishCameraTrack: true,
        autoSubscribeAudio: false,
        autoSubscribeVideo: false,
      });

      rtcEngineRef.current = engine;

      // Notify socket + store
      startLive(channelName);
      socket?.emit('liveStart', {
        hostId: user?._id,
        hostName: user?.username,
        hostAvatar: user?.avatar,
        channelName,
      });

      // Start duration timer
      timerRef.current = setInterval(() => incrementDuration(), 1000);
    } catch (err) {
      console.error('Failed to start live:', err);
      Alert.alert('Error', 'Failed to start live stream. Please try again.');
      navigation.goBack();
    } finally {
      setIsStarting(false);
    }
  };

  const cleanupLive = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (rtcEngineRef.current) {
      try {
        rtcEngineRef.current.stopPreview();
        rtcEngineRef.current.leaveChannel();
        rtcEngineRef.current.disableVideo();
        rtcEngineRef.current.disableAudio();
        rtcEngineRef.current.release();
      } catch (e) {}
      rtcEngineRef.current = null;
    }

    if (socket && liveChannelName) {
      socket.emit('liveEnd', { channelName: liveChannelName });
    }
    endLive();
  }, [socket, liveChannelName, endLive]);

  const handleEndLive = () => {
    Alert.alert('End Live', 'Are you sure you want to end the stream?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Live',
        style: 'destructive',
        onPress: () => {
          cleanupLive();
          navigation.goBack();
        },
      },
    ]);
  };

  const toggleMic = () => {
    setIsMicEnabled((prev) => {
      const next = !prev;
      rtcEngineRef.current?.muteLocalAudioStream(!next);
      return next;
    });
  };

  const toggleCamera = () => {
    setIsCameraEnabled((prev) => {
      const next = !prev;
      rtcEngineRef.current?.enableLocalVideo(next);
      return next;
    });
  };

  const switchCamera = () => rtcEngineRef.current?.switchCamera();

  const sendComment = () => {
    if (!commentText.trim() || !socket) return;
    const comment: LiveComment = {
      userId: user?._id || '',
      username: user?.username || '',
      avatar: user?.avatar,
      text: commentText.trim(),
      time: new Date().toISOString(),
    };
    socket.emit('liveComment', { channelName: liveChannelName, comment });
    setCommentText('');
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const renderComment = ({ item }: { item: LiveComment }) => (
    <View style={styles.commentPill}>
      <Text style={styles.commentUsername}>{item.username} </Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  // Render local camera preview
  let RtcSurfaceView: any = null;
  if (!isExpoGo) {
    try {
      RtcSurfaceView = require('react-native-agora').RtcSurfaceView;
    } catch (e) {}
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Camera Feed (full screen) */}
      {RtcSurfaceView && isCameraEnabled ? (
        <RtcSurfaceView
          style={StyleSheet.absoluteFill}
          canvas={{ uid: 0, renderMode: 1 }}
          zOrderMediaOverlay={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noCameraPlaceholder]}>
          <Ionicons name="camera-off-outline" size={64} color="rgba(255,255,255,0.4)" />
          <Text style={styles.noCameraText}>Camera Off</Text>
        </View>
      )}

      {/* Dark gradient overlay top + bottom */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
        locations={[0, 0.2, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        <View style={styles.topCenter}>
          <Text style={styles.durationText}>{formatDuration(liveDuration)}</Text>
        </View>

        <View style={styles.viewerChip}>
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.viewerText}>{viewerCount}</Text>
        </View>
      </View>

      {/* Host info */}
      <View style={styles.hostInfo}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.hostAvatar} />
        ) : (
          <MaterialIcons name="account-circle" size={36} color="#fff" />
        )}
        <Text style={styles.hostName}>{user?.username}</Text>
      </View>

      {/* ── Comments overlay ── */}
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

        {/* Comment input */}
        <View style={styles.commentInputRow}>
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Say something..."
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

        {/* ── Control buttons ── */}
        <View style={styles.controls}>
          <TouchableOpacity style={[styles.controlBtn, !isMicEnabled && styles.controlBtnOff]} onPress={toggleMic}>
            <Ionicons name={isMicEnabled ? 'mic' : 'mic-off'} size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, !isCameraEnabled && styles.controlBtnOff]} onPress={toggleCamera}>
            <Ionicons name={isCameraEnabled ? 'videocam' : 'videocam-off'} size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndLive}>
            <Text style={styles.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Starting overlay */}
      {isStarting && (
        <BlurView intensity={60} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.startingOverlay}>
            <View style={styles.goingLiveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.goingLiveText}>Going Live...</Text>
            </View>
          </View>
        </BlurView>
      )}
    </Animated.View>
  );
};

export default LiveBroadcastScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  noCameraPlaceholder: {
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  noCameraText: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 8,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: { color: '#fff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  topCenter: { flex: 1, alignItems: 'center' },
  durationText: { color: '#fff', fontSize: 14, fontFamily: 'monospace' },
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

  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  hostAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#E53935' },
  hostName: { color: '#fff', fontWeight: '700', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  bottomSection: { position: 'absolute', bottom: 0, left: 0, right: 0 },

  commentList: { maxHeight: height * 0.3, paddingHorizontal: 12 },
  commentPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: width * 0.75,
  },
  commentUsername: { color: '#FFD740', fontWeight: '700', fontSize: 13 },
  commentText: { color: '#fff', fontSize: 13, flexShrink: 1 },

  commentInputRow: { paddingHorizontal: 12, paddingBottom: 8 },
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

  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 10,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  controlBtnOff: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' },
  endBtn: {
    backgroundColor: '#E53935',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  endBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  startingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  goingLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229,57,53,0.9)',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
  },
  goingLiveText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
});
