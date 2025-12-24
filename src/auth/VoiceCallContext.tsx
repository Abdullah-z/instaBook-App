import React, {
  createContext,
  useEffect,
  useState,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import { Alert, Platform } from 'react-native';
// Conditionally import agora only in development builds
// import type { IRtcEngine } from 'react-native-agora';
// import { ChannelProfileType } from 'react-native-agora';
import { Audio as ExpoAudio } from 'expo-av';
import Constants from 'expo-constants';

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
  const { socket } = useContext(SocketContext);
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
  const initializeAgoraEngine = useCallback(async () => {
    try {
      // Check if running in Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log(
          '⚠️ Running in Expo Go - Voice Calling is disabled. This avoids native module crashes.'
        );
        return;
      }

      if (rtcEngineRef.current) {
        console.log('⚠️ Agora Engine already initialized, skipping...');
        return; // Already initialized
      }

      // 1. Request Microphone Permissions
      console.log('🎤 Requesting microphone permissions...');
      const { status } = await ExpoAudio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Microphone permission denied!');
        return;
      }
      console.log('✅ Microphone permission granted');

      // 2. Configure Audio Mode for Voice Call
      console.log('🔊 Configuring audio mode...');
      await ExpoAudio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        // On Android, we want to ensure it acts like a VOIP call
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Default to speaker for now, or true for earpiece
      });

      const AGORA_APP_ID = Constants.expoConfig?.extra?.agoraAppId;

      if (!AGORA_APP_ID) {
        console.error('❌ ERROR: AGORA_APP_ID is not set! Update it in VoiceCallContext.tsx');
        return;
      }

      console.log('🔧 Creating Agora RTC Engine with App ID: ' + AGORA_APP_ID);

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
        engine.initialize({ appId: AGORA_APP_ID });
      } catch (err) {
        console.error('❌ CRITICAL: Failed to initialize Agora native engine:', err);
        return;
      }

      console.log('🔧 Engine created, enabling audio...');
      engine.enableAudio();

      if (callState.isVideo) {
        console.log('🔧 Enabling video...');
        engine.enableVideo();
      }

      console.log('🔧 Setting channel profile to Communication...');
      engine.setChannelProfile(ChannelProfile?.ChannelProfileCommunication || 0);

      console.log('🔧 Enabling speaker...');
      engine.setDefaultAudioRouteToSpeakerphone(true);

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection: any, elapsed: any) => {
          console.log(
            `✅ onJoinChannelSuccess: channel=${connection.channelId}, uid=${connection.localUid}`
          );
        },
        onUserJoined: (connection: any, uid: any, elapsed: any) => {
          console.log(`👤 onUserJoined: remoteUid=${uid}`);
          setRemoteUid(uid);
        },
        onUserOffline: (connection: any, uid: any, reason: any) => {
          console.log(`👤 onUserOffline: remoteUid=${uid}, reason=${reason}`);
          setRemoteUid(null);
        },
        onError: (err: any, msg: any) => {
          console.error(`❌ Agora Error code: ${err}, msg: ${msg}`);
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
      console.error('❌ Failed to initialize Agora Engine:', err);
      console.log('Error details:', JSON.stringify(err, null, 2));
    }
  }, []);

  // Join a channel with token
  const joinChannel = useCallback(
    async (channelName: string, token: string, uid: number) => {
      try {
        if (!rtcEngineRef.current) {
          console.log('🔧 Engine not initialized, initializing now...');
          await initializeAgoraEngine();
        }

        if (!rtcEngineRef.current) {
          console.error('❌ Failed to initialize engine before joining channel');
          return;
        }

        console.log(`🔧 Joining channel: ${channelName} with UID: ${uid}`);

        // Enable remote audio - enabled by default in enableAudio()
        try {
          rtcEngineRef.current.joinChannel(token, channelName, uid, {});
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

  // Leave channel
  const leaveChannel = useCallback(async () => {
    try {
      if (rtcEngineRef.current) {
        rtcEngineRef.current.leaveChannel();
        console.log('✅ Left channel');
      } else {
        console.log('⚠️ leaveChannel called but engine is null');
      }
    } catch (err) {
      console.error('❌ Failed to leave channel:', err);
    }
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    try {
      const newState = !isMicEnabled;
      if (rtcEngineRef.current) {
        rtcEngineRef.current.enableLocalAudio(newState);
        setIsMicEnabled(newState);
        console.log(`🎤 Microphone ${newState ? 'enabled' : 'disabled'}`);
      } else {
        console.warn('⚠️ cannot toggle mic, rtcEngine is null');
      }
    } catch (err) {
      console.error('❌ Failed to toggle mic:', err);
    }
  }, [isMicEnabled]);

  // Toggle speaker
  const toggleSpeaker = useCallback(async () => {
    try {
      const newState = !isSpeakerEnabled;
      if (rtcEngineRef.current) {
        rtcEngineRef.current.setDefaultAudioRouteToSpeakerphone(newState);
        setIsSpeakerEnabled(newState);
        console.log(`🔊 Speaker ${newState ? 'enabled' : 'disabled'}`);
      } else {
        console.warn('⚠️ cannot toggle speaker, rtcEngine is null');
      }
    } catch (err) {
      console.error('❌ Failed to toggle speaker:', err);
    }
  }, [isSpeakerEnabled]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const newState = !isVideoEnabled;
      if (rtcEngineRef.current) {
        rtcEngineRef.current.enableLocalVideo(newState);
        setIsVideoEnabled(newState);
        console.log(`📹 Video ${newState ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      console.error('❌ Failed to toggle video:', err);
    }
  }, [isVideoEnabled]);

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
      await initializeAgoraEngine();
      joinChannel(channelName, token, uid);
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

  const rejectCall = useCallback(() => {
    if (!socket || !callState.callerId) return;

    console.log(`❌ Rejecting call from ${callState.callerName}`);
    stopIncomingSound();

    socket.emit('voiceCallRejected', {
      callerId: callState.callerId,
      recipientId: user?._id,
    });

    stopRingingSound();

    setCallState((prev) => ({
      ...prev,
      remoteCalling: false,
      callerId: null,
      callerName: null,
      callerAvatar: null,
    }));
  }, [socket, user, callState.callerId, callState.callerName, stopIncomingSound, stopRingingSound]);

  const endCall = useCallback(async () => {
    if (!socket) return;

    console.log('📵 Ending call');

    // Leave Agora channel
    await leaveChannel();

    stopRingingSound();
    stopIncomingSound();

    // Disable audio
    try {
      rtcEngineRef.current?.disableAudio();
    } catch (err) {
      console.error('Error disabling audio:', err);
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
    setRemoteUid(null);

    // Notify other party
    socket.emit('voiceCallEnded', {
      callerId: callState.recipientId || callState.callerId,
      recipientId: user?._id,
    });
  }, [
    socket,
    user,
    callState.recipientId,
    callState.callerId,
    leaveChannel,
    stopRingingSound,
    stopIncomingSound,
  ]);

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
        await initializeAgoraEngine();
        joinChannel(channelName, token, uid);
      }
    });

    socket.on('voiceCallRejected', (data: any) => {
      console.log('📱 Call rejected by recipient');
      try {
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
        stopRingingSound();
        stopIncomingSound();
      } catch (err) {
        console.error('❌ Error handling voiceCallRejected:', err);
      }
    });

    socket.on('voiceCallEnded', (data: any) => {
      console.log('📱 Call ended');
      try {
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
