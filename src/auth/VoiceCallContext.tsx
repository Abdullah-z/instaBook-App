import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import useSocketStore from '../store/useSocketStore';
import { AuthContext } from './AuthContext';
import { Alert, Platform } from 'react-native';
// Conditionally import agora only in development builds
// import type { IRtcEngine } from 'react-native-agora';
// import { ChannelProfileType } from 'react-native-agora';
import { Audio as ExpoAudio } from 'expo-av';
import Constants from 'expo-constants';
import { sendMessage } from '../api/messageAPI';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Type stubs for when agora is not available
type IRtcEngine = any;
type ChannelProfileType = any;

interface CallState {
  inCall: boolean;
  remoteCalling: boolean;
  callerId: string | null;
  callerName: string | null;
  callerAvatar: string | null;
  recipientId: string | null;
  recipientName: string | null;
  recipientAvatar: string | null;
  callDuration: number;
  isVideo: boolean;
}

interface VoiceCallContextType {
  callState: CallState;
  callDuration: number;
  initiateCall: (
    recipientId: string,
    recipientName: string,
    recipientAvatar: string,
    isVideo?: boolean
  ) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  callToken: string | null;
  toggleMic: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  isMicEnabled: boolean;
  isSpeakerEnabled: boolean;
  isVideoEnabled: boolean;
  remoteUid: number | null;
  handleIncomingCallFromPush: (data: any) => void;
}

export const VoiceCallContext = createContext<VoiceCallContextType>({
  callState: {
    inCall: false,
    remoteCalling: false,
    callerId: null,
    callerName: null,
    callerAvatar: null,
    recipientId: null,
    recipientName: null,
    recipientAvatar: null,
    callDuration: 0,
    isVideo: false,
  },
  callDuration: 0,
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  callToken: null,
  toggleMic: () => {},
  toggleSpeaker: () => {},
  toggleVideo: () => {},
  switchCamera: () => {},
  isMicEnabled: true,
  isSpeakerEnabled: true,
  isVideoEnabled: true,
  remoteUid: null,
  handleIncomingCallFromPush: () => {},
});

export const VoiceCallProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useSocketStore();
  const { user } = useContext(AuthContext);
  const rtcEngineRef = useRef<IRtcEngine | null>(null);

  const [callState, setCallState] = useState<CallState>({
    inCall: false,
    remoteCalling: false,
    callerId: null,
    callerName: null,
    callerAvatar: null,
    recipientId: null,
    recipientName: null,
    recipientAvatar: null,
    callDuration: 0,
    isVideo: false,
  });
  const [callToken, setCallToken] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);

  // Refs to track current states for use in async callbacks and engine setup
  // These fix the stale closure issues during call connection phase
  const isMicEnabledRef = useRef(true);
  const isSpeakerEnabledRef = useRef(true);
  const isVideoEnabledRef = useRef(true);

  const soundRef = useRef<ExpoAudio.Sound | null>(null);
  const incomingSoundRef = useRef<ExpoAudio.Sound | null>(null);

  // Load and play ringing sound
  const playRingingSound = useCallback(async () => {
    console.log('📢 Starting outgoing ringing sound...');
    try {
      const { sound } = await ExpoAudio.Sound.createAsync(
        require('../constants/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
      console.log('✅ Outgoing ringing sound started');
    } catch (err) {
      console.error('❌ Failed to play ringing sound:', err);
    }
  }, []);

  const stopRingingSound = useCallback(async () => {
    console.log('📢 Stopping ringing sound...');
    try {
      if (soundRef.current) {
        const sound = soundRef.current;
        soundRef.current = null; // Clear ref immediately to prevent race conditions
        try {
          await sound.stopAsync();
        } catch (e) {
          console.log('   (Stop ringing failed - sound might be already stopped)');
        }
        try {
          await sound.unloadAsync();
          console.log('✅ Ringing sound unloaded');
        } catch (e) {
          console.log('   (Unload ringing failed)');
        }
      } else {
        console.log('   (No ringing sound playing)');
      }
    } catch (err) {
      console.error('❌ Failed to stop ringing sound:', err);
    }
  }, []);

  // Play incoming call ringtone
  const playIncomingSound = useCallback(async () => {
    try {
      const { sound } = await ExpoAudio.Sound.createAsync(
        require('../constants/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      incomingSoundRef.current = sound;
    } catch (err) {
      console.error('Failed to play incoming sound:', err);
    }
  }, []);

  const stopIncomingSound = useCallback(async () => {
    console.log('📢 Stopping incoming call sound...');
    try {
      if (incomingSoundRef.current) {
        const sound = incomingSoundRef.current;
        incomingSoundRef.current = null; // Clear ref immediately
        try {
          await sound.stopAsync();
        } catch (e) {
          console.log('   (Stop incoming failed)');
        }
        try {
          await sound.unloadAsync();
          console.log('✅ Incoming call sound unloaded');
        } catch (e) {
          console.log('   (Unload incoming failed)');
        }
      } else {
        console.log('   (No incoming sound playing)');
      }
    } catch (err) {
      console.error('❌ Failed to stop incoming sound:', err);
    }
  }, []);

  // ⚠️ IMPORTANT: Update this with your real Agora App ID from https://console.agora.io
  const AGORA_APP_ID = '57f1b0fb4940493faf15457d2388d722'; // TODO: Replace with your actual ID

  // Initialize Agora RTC Engine
  const initializeAgoraEngine = useCallback(async (isVideo: boolean = false) => {
    console.log('Initialize Agora Engine started');
    try {
      // Check if running in Expo Go
      if (Constants.appOwnership === 'expo') {
        const msg = '⚠️ Expo Go detected - Voice Calling disabled';
        console.log(msg);
        console.log(msg);
        return;
      }

      if (rtcEngineRef.current) {
        console.log('⚠️ Engine already initialized, skipping...');
        return; // Already initialized
      }

      // 1. Request Permissions
      console.log('Requesting permissions...');

      if (Platform.OS === 'android') {
        const { PermissionsAndroid } = require('react-native');
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (isVideo) {
          permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        if (
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !==
          PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.error('❌ Microphone permission denied');
          return;
        }

        if (
          isVideo &&
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.error('❌ Camera permission denied');
          Alert.alert('Permission Denied', 'Camera permission is required for video calls.');
          return;
        }
        console.log('✅ Permissions granted (Android)');
      } else {
        // iOS / specific Expo Go cases
        console.log('🎤 Requesting microphone permissions (Expo wrapper)...');
        const { status } = await ExpoAudio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.error('❌ Microphone permission denied (iOS)');
          return;
        }
        console.log('✅ Microphone permission granted');
      }

      // 2. Configure Audio Mode for Voice Call
      console.log('🔊 Configuring audio mode for Agora...');
      // Minimal config to allow recording and playback
      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false, // Don't duck, we want full volume
      });

      const configAppId = Constants.expoConfig?.extra?.agoraAppId || AGORA_APP_ID;

      if (!configAppId) {
        console.error('❌ ERROR: AGORA_APP_ID is not set!');
        return;
      }

      console.log('🔧 Creating Agora RTC Engine with App ID: ' + configAppId);

      // Dynamically require Agora to avoid native module crash in Expo Go
      let createAgoraRtcEngine;
      let ChannelProfile;
      try {
        const Agora = require('react-native-agora');
        createAgoraRtcEngine = Agora.createAgoraRtcEngine;
        ChannelProfile = Agora.ChannelProfileType;
      } catch (error) {
        console.error('Failed to load react-native-agora:', error);
        return;
      }

      // Correct way for react-native-agora v4.x
      let engine;
      try {
        engine = createAgoraRtcEngine();
        engine.initialize({ appId: configAppId });
      } catch (err) {
        console.error('❌ CRITICAL: Failed to initialize Agora native engine:', err);
        return;
      }

      console.log('🔧 Engine created, enabling audio...');
      engine.enableAudio();

      // Set audio scenario for better VOIP performance
      // Scenario 3 (GameStreaming) often works better for high-quality RN audio
      engine.setAudioProfile(0, 3);

      if (isVideo) {
        console.log('🔧 Enabling video and starting preview...');
        engine.enableVideo();
        engine.startPreview();
      }

      console.log('🔧 Setting channel profile to Communication...');
      engine.setChannelProfile(ChannelProfile?.ChannelProfileCommunication || 0);

      console.log('🔧 Enabling speaker by default...');
      engine.setDefaultAudioRouteToSpeakerphone(true);
      engine.setEnableSpeakerphone(true); // Ensure speaker is on

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: any, elapsed: any) => {
          const msg = `✅ onJoinChannelSuccess: ${connection.channelId}`;
          console.log(msg);
        },
        onUserJoined: (connection: any, uid: any, elapsed: any) => {
          const msg = `👤 onUserJoined: ${uid}`;
          console.log(msg);
          setRemoteUid(uid);
        },
        onUserOffline: (connection: any, uid: any, reason: any) => {
          const msg = `👤 onUserOffline: ${uid}, reason=${reason}`;
          console.log(msg);
          setRemoteUid(null);
        },
        onError: (err: any, msg: any) => {
          const errorMsg = `❌ Agora Error ${err}: ${msg}`;
          console.error(errorMsg);
          // Prevent crash if engine is in a bad state
          if (err === 110) {
            // ERR_NOT_INITIALIZED
            console.log('Engine not initialized, clearing ref');
            rtcEngineRef.current = null;
          }
        },
      });

      rtcEngineRef.current = engine;
      console.log('✅ Agora Engine initialized successfully');
    } catch (err) {
      console.error(`❌ Failed to initialize Engine: ${err}`);
      console.error('❌ Failed to initialize Agora Engine:', err);
      console.log('Error details:', JSON.stringify(err, null, 2));
    }
  }, []);

  // Join a channel with token
  const joinChannel = useCallback(
    async (channelName: string, token: string, uid: number, isVideo: boolean = false) => {
      console.log(`Joining channel: ${channelName} with UID ${uid}`);
      try {
        if (!rtcEngineRef.current) {
          console.log('🔧 Engine not initialized, initializing now...');
          await initializeAgoraEngine(isVideo);
        }

        if (rtcEngineRef.current) {
          // Safety: Ensure video is enabled if this is a video call
          if (isVideo) {
            console.log('🔧 Enforcing video enable before join');
            rtcEngineRef.current.enableVideo();
            rtcEngineRef.current.startPreview();
          }
        }

        if (!rtcEngineRef.current) {
          console.error('❌ Failed to initialize engine before joining');
          return;
        }

        console.log('Calling joinChannel API...');

        // Enable remote audio - enabled by default in enableAudio()
        try {
          rtcEngineRef.current.joinChannel(token, channelName, uid, {
            publishMicrophoneTrack: true,
            publishCameraTrack: isVideo,
            autoSubscribeAudio: true,
            autoSubscribeVideo: isVideo,
          });

          // CRITICAL: Explicitly enforce initial mic and speaker states after joining
          setTimeout(() => {
            if (rtcEngineRef.current) {
              console.log(
                '🔧 Enforcing initial states from refs: Mic=',
                isMicEnabledRef.current,
                'Speaker=',
                isSpeakerEnabledRef.current
              );
              rtcEngineRef.current.muteLocalAudioStream(!isMicEnabledRef.current);
              rtcEngineRef.current.setEnableSpeakerphone(isSpeakerEnabledRef.current);
              rtcEngineRef.current.muteAllRemoteAudioStreams(false);
              if (isVideo) {
                rtcEngineRef.current.enableLocalVideo(isVideoEnabledRef.current);
              }
            }
          }, 1000); // Give it a second to establish connection

          console.log(`✅ Successfully joined channel: ${channelName}`);
        } catch (err) {
          console.error('❌ CRITICAL: Failed to join channel via bridge:', err);
        }
      } catch (err) {
        console.error('❌ Failed to join channel:', err);
      }
    },
    [initializeAgoraEngine]
  );

  // Leave channel and cleanup
  const cleanupResources = useCallback(async () => {
    console.log('🧹 Starting resource cleanup...');
    try {
      // 1. Stop Sounds
      await stopRingingSound();
      await stopIncomingSound();

      // 2. Agora Cleanup
      if (rtcEngineRef.current) {
        const engine = rtcEngineRef.current;
        try {
          engine.stopPreview();
          engine.leaveChannel();
          engine.disableVideo();
          engine.disableAudio();
          engine.unregisterEventHandler({});
          engine.release();
        } catch (e) {
          console.log('   (Agora release failed - already released?)');
        }
        rtcEngineRef.current = null;
        console.log('✅ Agora Engine released');
      }

      // 3. Reset Expo Audio Mode
      try {
        await ExpoAudio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        console.log('✅ Audio mode reset to standard');
      } catch (e) {
        console.error('❌ Failed to reset audio mode:', e);
      }
    } catch (err) {
      console.error('❌ Error during cleanup:', err);
    }
  }, [stopRingingSound, stopIncomingSound]);

  // Leave channel
  const leaveChannel = useCallback(async () => {
    try {
      if (rtcEngineRef.current) {
        rtcEngineRef.current.leaveChannel();
        console.log('✅ Left channel');
      }
    } catch (err) {
      console.error('❌ Failed to leave channel:', err);
    }
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    try {
      const newState = !isMicEnabledRef.current;
      setIsMicEnabled(newState);
      isMicEnabledRef.current = newState;
      console.log(`🎤 UI State: Microphone ${newState ? 'enabled' : 'disabled'}`);

      if (rtcEngineRef.current) {
        rtcEngineRef.current.muteLocalAudioStream(!newState);
        console.log('✅ Agora Engine: Microphone muted state updated');
      }
    } catch (err) {
      console.error('❌ Failed to toggle mic:', err);
    }
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(async () => {
    try {
      const newState = !isSpeakerEnabledRef.current;
      setIsSpeakerEnabled(newState);
      isSpeakerEnabledRef.current = newState;
      console.log(`🔊 UI State: Speaker ${newState ? 'enabled' : 'disabled'}`);

      if (rtcEngineRef.current) {
        rtcEngineRef.current.setEnableSpeakerphone(newState);
        console.log('✅ Agora Engine: Speaker state updated');
      }
    } catch (err) {
      console.error('❌ Failed to toggle speaker:', err);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const newState = !isVideoEnabledRef.current;
      setIsVideoEnabled(newState);
      isVideoEnabledRef.current = newState;
      console.log(`📹 UI State: Video ${newState ? 'enabled' : 'disabled'}`);

      if (rtcEngineRef.current) {
        rtcEngineRef.current.enableLocalVideo(newState);
        console.log('✅ Agora Engine: Video state updated');
      }
    } catch (err) {
      console.error('❌ Failed to toggle video:', err);
    }
  }, []);

  // Switch camera
  const switchCamera = useCallback(async () => {
    try {
      if (rtcEngineRef.current) {
        rtcEngineRef.current.switchCamera();
        console.log('🔄 Camera switched');
      }
    } catch (err) {
      console.error('❌ Failed to switch camera:', err);
    }
  }, []);

  // Generate a unique channel name based on user IDs
  const generateChannelName = (userId1: string, userId2: string) => {
    const ids = [userId1, userId2].sort();
    return `call_${ids[0]}_${ids[1]}`;
  };

  // Fetch Agora token from your backend
  const fetchAgoraToken = async (channelName: string, uid: number) => {
    try {
      const response = await fetch(
        `https://instabook-server-production.up.railway.app/api/agora/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channelName,
            uid,
            role: 'publisher', // or 'subscriber'
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Token fetch failed with status:', response.status);
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      console.log('✅ Token fetched successfully for channel:', channelName);
      setCallToken(data.token);
      return data.token;
    } catch (err) {
      console.error('Failed to fetch Agora token:', err);
      return null;
    }
  };

  const initiateCall = useCallback(
    (
      recipientId: string,
      recipientName: string,
      recipientAvatar: string,
      isVideo: boolean = false
    ) => {
      if (Constants.appOwnership === 'expo') {
        alert('Calling is not available in Expo Go. Please use a Development Build.');
        return;
      }
      if (!socket || !user) return;

      console.log(`📞 Initiating ${isVideo ? 'video' : 'voice'} call to ${recipientName}`);
      setCallState((prev) => ({
        ...prev,
        inCall: true,
        recipientId,
        recipientName,
        recipientAvatar,
        isVideo,
      }));

      // Send call initiation via socket
      socket.emit('voiceCallInitiate', {
        callerId: user._id,
        callerName: user.username,
        callerAvatar: user.avatar,
        recipientId,
        recipientName,
        timestamp: new Date().toISOString(),
        isVideo,
      });

      // Start ringing sound
      playRingingSound();
    },
    [socket, user, playRingingSound]
  );

  // Helper to log call to chat
  const logCallToChat = useCallback(
    async (
      targetId: string,
      status: 'accepted' | 'rejected' | 'missed' | 'cancelled',
      duration: number = 0,
      isVideo: boolean = false
    ) => {
      try {
        const callData = {
          status,
          duration,
          video: isVideo,
        };

        const res = await sendMessage({
          recipient: targetId,
          call: callData,
        });

        if (socket && socket.connected) {
          socket.emit('addMessage', {
            _id: res.message?._id || Date.now().toString(),
            sender: user,
            recipient: targetId,
            call: callData,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to log call to chat:', err);
      }
    },
    [socket, user]
  );

  const acceptCall = useCallback(async () => {
    if (Constants.appOwnership === 'expo') {
      alert('Voice calling is not available in Expo Go. Please use a Development Build.');
      return;
    }
    if (!socket || !callState.callerId) return;

    console.log(`✅ Accepting call from ${callState.callerName}`);
    setCallState((prev) => ({
      ...prev,
      inCall: true,
      remoteCalling: false,
    }));

    stopIncomingSound();

    // Send acceptance via socket
    socket.emit('voiceCallAccepted', {
      callerId: callState.callerId,
      recipientId: user?._id,
      isVideo: callState.isVideo,
    });

    // Stop ringing
    stopRingingSound();

    // Generate channel and fetch token
    const channelName = generateChannelName(callState.callerId, user?._id || '');
    const uid = Math.floor(Math.random() * 100000); // Generate UID once
    const token = await fetchAgoraToken(channelName, uid);

    if (token) {
      // Initialize engine and join channel
      await initializeAgoraEngine(callState.isVideo);
      joinChannel(channelName, token, uid, callState.isVideo);
    }
  }, [
    socket,
    user,
    callState.callerId,
    callState.callerName,
    stopIncomingSound,
    stopRingingSound,
    initializeAgoraEngine,
    joinChannel,
  ]);

  const rejectCall = useCallback(async () => {
    if (!socket || !callState.callerId) return;

    console.log(`❌ Rejecting call from ${callState.callerName}`);

    logCallToChat(callState.callerId, 'rejected', 0, callState.isVideo);

    socket.emit('voiceCallRejected', {
      callerId: callState.callerId,
      recipientId: user?._id,
    });

    await cleanupResources();

    setCallState((prev) => ({
      ...prev,
      remoteCalling: false,
      callerId: null,
      callerName: null,
      callerAvatar: null,
    }));
  }, [socket, user, callState, cleanupResources, logCallToChat]);

  const endCall = useCallback(async () => {
    if (!socket) return;

    console.log('📵 Ending call');

    // Centralized resource cleanup (Leave, Disable, Release, Reset Audio)
    await cleanupResources();

    // Log call to chat
    const targetId = callState.recipientId || callState.callerId;
    if (targetId) {
      if (remoteUid) {
        // Call was connected
        logCallToChat(targetId, 'accepted', callDuration, callState.isVideo);
      } else if (callState.recipientId) {
        // I was the caller and cancelled before they answered
        logCallToChat(targetId, 'missed', 0, callState.isVideo);
      }
    }

    setCallState((prev) => ({
      ...prev,
      inCall: false,
      callDuration: 0,
      callerId: null,
      callerName: null,
      callerAvatar: null,
      recipientId: null,
      recipientName: null,
      recipientAvatar: null,
      isVideo: false,
    }));
    setCallDuration(0);
    setCallToken(null);
    setIsMicEnabled(true);
    setIsSpeakerEnabled(true);
    setIsVideoEnabled(true);
    isMicEnabledRef.current = true;
    isSpeakerEnabledRef.current = true;
    isVideoEnabledRef.current = true;
    setRemoteUid(null);

    // Notify other party
    socket.emit('voiceCallEnded', {
      callerId: callState.recipientId || callState.callerId,
      recipientId: user?._id,
    });
  }, [socket, user, callState, cleanupResources, logCallToChat, remoteUid, callDuration]);

  const handleIncomingCallFromPush = useCallback(
    (data: any) => {
      if (!data) return;
      console.log('📞 Handling incoming call from PUSH:', data);
      try {
        setCallState((prev) => ({
          ...prev,
          remoteCalling: true,
          callerId: data?.callerId || null,
          callerName: data?.callerName || 'Unknown Caller',
          callerAvatar: data?.callerAvatar || null,
          isVideo: !!data?.isVideo,
        }));
        playIncomingSound();
      } catch (err) {
        console.error('❌ Error handling incoming call data:', err);
      }
    },
    [playIncomingSound]
  );

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    socket.on('voiceCallIncoming', (data: any) => {
      console.log(`📱 Incoming call from ${data.callerName}`);
      setCallState((prev) => ({
        ...prev,
        remoteCalling: true,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        isVideo: !!data.isVideo,
      }));
      playIncomingSound();
    });

    socket.on('voiceCallAccepted', async (data: any) => {
      console.log('Call accepted by recipient');
      stopRingingSound();
      const channelName = generateChannelName(user?._id || '', data.recipientId);
      const uid = Math.floor(Math.random() * 100000); // Generate UID once
      const token = await fetchAgoraToken(channelName, uid);

      if (token) {
        // Initialize engine and join channel
        await initializeAgoraEngine(!!data.isVideo);
        joinChannel(channelName, token, uid, !!data.isVideo);
      }
    });

    socket.on('voiceCallRejected', async (data: any) => {
      console.log('📱 Call rejected by recipient');
      try {
        await cleanupResources();
        setCallState((prev) => ({
          ...prev,
          inCall: false,
          remoteCalling: false,
          callerId: null,
          callerName: null,
          callerAvatar: null,
          recipientId: null,
          recipientName: null,
          recipientAvatar: null,
          callDuration: 0,
          isVideo: false,
        }));
      } catch (err) {
        console.error('❌ Error handling voiceCallRejected:', err);
      }
    });

    socket.on('voiceCallEnded', async (data: any) => {
      console.log('📵 Call ended by remote party');
      try {
        await cleanupResources();
        setCallState((prev) => ({
          inCall: false,
          remoteCalling: false,
          callerId: null,
          callerName: null,
          callerAvatar: null,
          recipientId: null,
          recipientName: null,
          recipientAvatar: null,
          callDuration: 0,
          isVideo: false,
        }));
        stopIncomingSound();
        stopRingingSound();
        setCallDuration(0);
        setCallToken(null);
        setRemoteUid(null);
      } catch (err) {
        console.error('❌ Error handling voiceCallEnded:', err);
      }
    });

    return () => {
      socket.off('voiceCallIncoming');
      socket.off('voiceCallAccepted');
      socket.off('voiceCallRejected');
      socket.off('voiceCallEnded');
      cleanupResources(); // Hard safety cleanup
    };
  }, [socket, user]);

  // Track call duration
  useEffect(() => {
    if (!callState.inCall || callState.remoteCalling) return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState.inCall, callState.remoteCalling]);

  const contextValue = useMemo(
    () => ({
      callState,
      callDuration,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      callToken,
      toggleMic,
      toggleSpeaker,
      toggleVideo,
      switchCamera,
      isMicEnabled,
      isSpeakerEnabled,
      isVideoEnabled,
      remoteUid,
      handleIncomingCallFromPush,
    }),
    [
      callState,
      callDuration,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
      callToken,
      toggleMic,
      toggleSpeaker,
      toggleVideo,
      switchCamera,
      isMicEnabled,
      isSpeakerEnabled,
      isVideoEnabled,
      remoteUid,
      handleIncomingCallFromPush,
    ]
  );

  return <VoiceCallContext.Provider value={contextValue}>{children}</VoiceCallContext.Provider>;
};
