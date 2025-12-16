import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import { AuthContext } from '../auth/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const VoiceCallScreen: React.FC = () => {
  const {
    callState,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleSpeaker,
    isMicEnabled,
    isSpeakerEnabled,
  } = useContext(VoiceCallContext);
  const { user } = useContext(AuthContext);

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const avatarUrl = callState.callerAvatar || callState.recipientAvatar;

  // Incoming call screen
  if (callState.remoteCalling && !callState.inCall) {
    return (
      <View style={styles.incomingCallContainer}>
        <View style={styles.incomingCallContent}>
          {callState.callerAvatar ? (
            <Image source={{ uri: callState.callerAvatar }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="account-circle" size={120} color="#fff" />
          )}
          <Text style={styles.incomingCallerName}>{callState.callerName}</Text>
          <Text style={styles.incomingCallText}>Incoming call...</Text>
        </View>

        <View style={styles.incomingCallActions}>
          <TouchableOpacity style={[styles.callButton, styles.rejectButton]} onPress={rejectCall}>
            <MaterialIcons name="call-end" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.callButton, styles.acceptButton]} onPress={acceptCall}>
            <MaterialIcons name="call" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active call screen
  if (callState.inCall) {
    return (
      <View style={styles.activeCallContainer}>
        <View style={styles.callInfo}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={[styles.avatar, styles.activeAvatar]} />
          ) : (
            <MaterialIcons name="account-circle" size={140} color="#1f6feb" />
          )}
          <Text style={styles.callPartnerName}>
            {callState.recipientName || callState.callerName}
          </Text>
          <Text style={styles.callDuration}>{formatDuration(callState.callDuration)}</Text>
        </View>

        <View style={styles.callControls}>
          <TouchableOpacity
            style={[styles.controlButton, !isMicEnabled && styles.disabledButton]}
            onPress={toggleMic}>
            <MaterialIcons
              name={isMicEnabled ? 'mic' : 'mic-off'}
              size={24}
              color={isMicEnabled ? '#333' : '#999'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !isSpeakerEnabled && styles.disabledButton]}
            onPress={toggleSpeaker}>
            <MaterialIcons
              name={isSpeakerEnabled ? 'volume-up' : 'volume-off'}
              size={24}
              color={isSpeakerEnabled ? '#333' : '#999'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
            <MaterialIcons name="call-end" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  incomingCallContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  incomingCallContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  incomingCallerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  incomingCallText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
  },
  incomingCallActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  activeCallContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    zIndex: 1000,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  callInfo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  callPartnerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  callDuration: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    fontFamily: 'monospace',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#ff4444',
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 20,
  },
  activeAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderColor: '#1f6feb',
  },
});

export default VoiceCallScreen;
