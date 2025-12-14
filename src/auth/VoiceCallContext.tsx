import React, { createContext, useEffect, useState, useContext } from 'react';
import { SocketContext } from './SocketContext';
import { AuthContext } from './AuthContext';

interface CallState {
  inCall: boolean;
  remoteCalling: boolean;
  callerId: string | null;
  callerName: string | null;
  recipientId: string | null;
  recipientName: string | null;
  callDuration: number;
}

interface VoiceCallContextType {
  callState: CallState;
  initiateCall: (recipientId: string, recipientName: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  callToken: string | null;
}

export const VoiceCallContext = createContext<VoiceCallContextType>({
  callState: {
    inCall: false,
    remoteCalling: false,
    callerId: null,
    callerName: null,
    recipientId: null,
    recipientName: null,
    callDuration: 0,
  },
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  callToken: null,
});

export const VoiceCallProvider = ({ children }: { children: React.ReactNode }) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [callState, setCallState] = useState<CallState>({
    inCall: false,
    remoteCalling: false,
    callerId: null,
    callerName: null,
    recipientId: null,
    recipientName: null,
    callDuration: 0,
  });
  const [callToken, setCallToken] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

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
        throw new Error('Failed to fetch token');
      }

      const data = await response.json();
      setCallToken(data.token);
      return data.token;
    } catch (err) {
      console.error('Failed to fetch Agora token:', err);
      return null;
    }
  };

  const initiateCall = (recipientId: string, recipientName: string) => {
    if (!socket || !user) return;

    console.log(`📞 Initiating call to ${recipientName}`);
    setCallState((prev) => ({
      ...prev,
      inCall: true,
      recipientId,
      recipientName,
    }));

    // Send call initiation via socket
    socket.emit('voiceCallInitiate', {
      callerId: user._id,
      callerName: user.username,
      recipientId,
      recipientName,
      timestamp: new Date().toISOString(),
    });
  };

  const acceptCall = async () => {
    if (!socket || !callState.callerId) return;

    console.log(`✅ Accepting call from ${callState.callerName}`);
    setCallState((prev) => ({
      ...prev,
      inCall: true,
      remoteCalling: false,
    }));

    // Send acceptance via socket
    socket.emit('voiceCallAccepted', {
      callerId: callState.callerId,
      recipientId: user?._id,
    });

    // Generate channel and fetch token
    const channelName = generateChannelName(callState.callerId, user?._id || '');
    await fetchAgoraToken(channelName, Math.floor(Math.random() * 10000));
  };

  const rejectCall = () => {
    if (!socket || !callState.callerId) return;

    console.log(`❌ Rejecting call from ${callState.callerName}`);

    socket.emit('voiceCallRejected', {
      callerId: callState.callerId,
      recipientId: user?._id,
    });

    setCallState((prev) => ({
      ...prev,
      remoteCalling: false,
      callerId: null,
      callerName: null,
    }));
  };

  const endCall = () => {
    if (!socket) return;

    console.log('📵 Ending call');
    setCallState((prev) => ({
      ...prev,
      inCall: false,
      callDuration: 0,
    }));
    setCallDuration(0);
    setCallToken(null);

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
      }));
    });

    socket.on('voiceCallAccepted', (data: any) => {
      console.log('Call accepted by recipient');
      const channelName = generateChannelName(user?._id || '', data.recipientId);
      fetchAgoraToken(channelName, Math.floor(Math.random() * 10000));
    });

    socket.on('voiceCallRejected', (data: any) => {
      console.log('Call rejected');
      setCallState((prev) => ({
        ...prev,
        inCall: false,
        remoteCalling: false,
      }));
    });

    socket.on('voiceCallEnded', (data: any) => {
      console.log('Call ended');
      setCallState((prev) => ({
        ...prev,
        inCall: false,
        remoteCalling: false,
        callDuration: 0,
      }));
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
      }}>
      {children}
    </VoiceCallContext.Provider>
  );
};
