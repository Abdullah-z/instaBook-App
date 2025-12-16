import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';
import type { IRtcEngine } from 'react-native-agora';
import { ChannelProfileType } from 'react-native-agora';
import { Audio as ExpoAudio } from 'expo-av';
import Constants from 'expo-constants';

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
}

interface VoiceCallContextType {
  callState: CallState;
  initiateCall: (recipientId: string, recipientName: string, recipientAvatar: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  callToken: string | null;
  toggleMic: () => void;
  toggleSpeaker: () => void;
  isMicEnabled: boolean;
  isSpeakerEnabled: boolean;
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
  },
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  callToken: null,
  toggleMic: () => {},
  toggleSpeaker: () => {},
  isMicEnabled: true,
  isSpeakerEnabled: true,
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
  });
  const [callToken, setCallToken] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const soundRef = useRef<ExpoAudio.Sound | null>(null);
  const incomingSoundRef = useRef<ExpoAudio.Sound | null>(null);

  // Load and play ringing sound
  const playRingingSound = async () => {
    try {
      const { sound } = await ExpoAudio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/phone/telephone-ring-03a.mp3' }, // Public ringing sound
        { shouldPlay: true, isLooping: true }
      );
      soundRef.current = sound;
    } catch (err) {
      console.error('Failed to play ringing sound:', err);
    }
  };

  const stopRingingSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop ringing sound:', err);
    }
  };

  // Play incoming call ringtone
  const playIncomingSound = async () => {
    try {
      const { sound } = await ExpoAudio.Sound.createAsync(
        require('../constants/sounds/ringtone.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      incomingSoundRef.current = sound;
    } catch (err) {
      console.error('Failed to play incoming sound:', err);
    }
  };

  const stopIncomingSound = async () => {
    try {
      if (incomingSoundRef.current) {
        await incomingSoundRef.current.stopAsync();
        await incomingSoundRef.current.unloadAsync();
        incomingSoundRef.current = null;
      }
    } catch (err) {
      console.error('Failed to stop incoming sound:', err);
    }
  };

  // ⚠️ IMPORTANT: Update this with your real Agora App ID from https://console.agora.io
  const AGORA_APP_ID = '57f1b0fb4940493faf15457d2388d722'; // TODO: Replace with your actual ID

  // Initialize Agora RTC Engine
  const initializeAgoraEngine = async () => {
    try {
      // Check if running in Expo Go
      if (Constants.appOwnership === 'expo') {
        console.log('⚠️ Running in Expo Go - Voice Calling is disabled');
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

      if (!AGORA_APP_ID) {
        console.error('❌ ERROR: AGORA_APP_ID is not set! Update it in VoiceCallContext.tsx');
        return;
      }

      console.log('🔧 Creating Agora RTC Engine with App ID: ' + AGORA_APP_ID);

      // Dynamically require Agora to avoid native module crash in Expo Go
      let createAgoraRtcEngine;
      try {
        const Agora = require('react-native-agora');
        createAgoraRtcEngine = Agora.createAgoraRtcEngine;
      } catch (error) {
        console.error('Failed to load react-native-agora:', error);
        return;
      }

      // Correct way for react-native-agora v4.x
      const engine = createAgoraRtcEngine();
      engine.initialize({ appId: AGORA_APP_ID });

      console.log('🔧 Engine created, enabling audio...');
      engine.enableAudio();

      console.log('🔧 Setting channel profile to Communication...');
      engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

      console.log('🔧 Enabling speaker...');
      engine.setDefaultAudioRouteToSpeakerphone(true);

      engine.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log(
            `✅ onJoinChannelSuccess: channel=${connection.channelId}, uid=${connection.localUid}`
          );
        },
        onUserJoined: (connection, remoteUid, elapsed) => {
          console.log(`👤 onUserJoined: remoteUid=${remoteUid}`);
        },
        onUserOffline: (connection, remoteUid, reason) => {
          console.log(`❌ onUserOffline: remoteUid=${remoteUid}`);
        },
        onError: (err, msg) => {
          console.error(`❌ Agora Error code: ${err}, msg: ${msg}`);
        },
      });

      rtcEngineRef.current = engine;
      console.log('✅ Agora Engine initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize Agora Engine:', err);
      console.log('Error details:', JSON.stringify(err, null, 2));
    }
  };

  // Join a channel with token
  // Join a channel with token
  const joinChannel = async (channelName: string, token: string, uid: number) => {
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

      rtcEngineRef.current.joinChannel(token, channelName, uid, {});

      console.log(`✅ Successfully joined channel: ${channelName}`);
    } catch (err) {
      console.error('❌ Failed to join channel:', err);
    }
  };

  // Leave channel
  const leaveChannel = async () => {
    try {
      rtcEngineRef.current?.leaveChannel();
      console.log('✅ Left channel');
    } catch (err) {
      console.error('❌ Failed to leave channel:', err);
    }
  };

  // Toggle microphone
  const toggleMic = async () => {
    try {
      const newState = !isMicEnabled;
      rtcEngineRef.current?.enableLocalAudio(newState);
      setIsMicEnabled(newState);
      console.log(`🎤 Microphone ${newState ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('❌ Failed to toggle mic:', err);
    }
  };

  // Toggle speaker
  const toggleSpeaker = async () => {
    try {
      const newState = !isSpeakerEnabled;
      rtcEngineRef.current?.setDefaultAudioRouteToSpeakerphone(newState);
      setIsSpeakerEnabled(newState);
      console.log(`🔊 Speaker ${newState ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('❌ Failed to toggle speaker:', err);
    }
  };

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

  const initiateCall = (recipientId: string, recipientName: string, recipientAvatar: string) => {
    if (Constants.appOwnership === 'expo') {
      alert('Voice calling is not available in Expo Go. Please use a Development Build.');
      return;
    }
    if (!socket || !user) return;

    console.log(`📞 Initiating call to ${recipientName}`);
    setCallState((prev) => ({
      ...prev,
      inCall: true,
      recipientId,
      recipientName,
      recipientAvatar,
    }));

    // Send call initiation via socket
    socket.emit('voiceCallInitiate', {
      callerId: user._id,
      callerName: user.username,
      callerAvatar: user.avatar,
      recipientId,
      recipientName,
      timestamp: new Date().toISOString(),
    });

    // Start ringing sound
    playRingingSound();
  };

  const acceptCall = async () => {
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
  };

  const rejectCall = () => {
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
  };

  const endCall = async () => {
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
    }));
    setCallDuration(0);
    setCallToken(null);
    setIsMicEnabled(true);
    setIsSpeakerEnabled(true);

    // Notify other party
    socket.emit('voiceCallEnded', {
      callerId: callState.recipientId || callState.callerId,
      recipientId: user?._id,
    });
  };

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
      console.log('Call rejected');
      stopRingingSound();
      setCallState((prev) => ({
        ...prev,
        inCall: false,
        remoteCalling: false,
      }));
      stopIncomingSound();
    });

    socket.on('voiceCallEnded', (data: any) => {
      console.log('Call ended');
      setCallState((prev) => ({
        ...prev,
        inCall: false,
        remoteCalling: false,
        callDuration: 0,
      }));
      stopIncomingSound();
      setCallDuration(0);
      setCallToken(null);
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
    if (!callState.inCall) return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
      setCallState((prev) => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [callState.inCall]);

  return (
    <VoiceCallContext.Provider
      value={{
        callState,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        callToken,
        toggleMic,
        toggleSpeaker,
        isMicEnabled,
        isSpeakerEnabled,
      }}>
      {children}
    </VoiceCallContext.Provider>
  );
};
