import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { VoiceCallContext } from '../auth/VoiceCallContext';
import { AuthContext } from '../auth/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const VoiceCallScreen: React.FC = () => {
  const {
    callState,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleSpeaker,
    toggleVideo,
    switchCamera,
    isMicEnabled,
    isSpeakerEnabled,
    isVideoEnabled,
    remoteUid,
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

  const avatarUrl =
    callState?.callerAvatar &&
    typeof callState.callerAvatar === 'string' &&
    callState.callerAvatar.trim() !== ''
      ? callState.callerAvatar
      : callState?.recipientAvatar &&
          typeof callState.recipientAvatar === 'string' &&
          callState.recipientAvatar.trim() !== ''
        ? callState.recipientAvatar
        : null;

  // If no call activity, return early before trying to render any images
  if (!callState?.remoteCalling && !callState?.inCall) {
    return null;
  }
  // Incoming call screen
  if (callState?.remoteCalling && !callState?.inCall) {
    return (
      <View style={styles.incomingCallContainer}>
        <View style={styles.incomingCallContent}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <MaterialIcons name="account-circle" size={120} color="#fff" />
          )}
          <Text style={styles.incomingCallerName}>{callState?.callerName || 'Unknown User'}</Text>
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
  if (callState?.inCall) {
    // Dynamically require Agora views
    let RtcSurfaceView: any = null;
    try {
      if (callState.isVideo) {
        const Agora = require('react-native-agora');
        RtcSurfaceView = Agora.RtcSurfaceView;
      }
    } catch (e) {
      console.error('Failed to load Agora views:', e);
    }

    return (
      <View style={styles.activeCallContainer}>
        {callState.isVideo ? (
          <View style={styles.videoContainer}>
            {/* Remote Video (Background) */}
            {remoteUid !== null ? (
              <RtcSurfaceView
                style={styles.remoteVideo}
                canvas={{ uid: remoteUid }}
                zOrderMediaOverlay={false}
              />
            ) : (
              <View style={styles.remoteVideoPlaceholder}>
                <MaterialIcons name="account-circle" size={140} color="#fff" />
                <Text style={styles.waitingText}>Waiting for participant...</Text>
              </View>
            )}

            {/* Local Video (PIP) */}
            {isVideoEnabled && (
              <View style={styles.localVideoContainer}>
                <RtcSurfaceView
                  style={styles.localVideo}
                  canvas={{ uid: 0 }} // 0 is always local user
                  zOrderMediaOverlay={true}
                />
              </View>
            )}

            {/* Call Info Overlay */}
            <View style={styles.videoCallOverlay}>
              <Text style={styles.videoPartnerName}>
                {callState?.recipientName || callState?.callerName || 'In Call'}
              </Text>
              <Text style={styles.videoDuration}>{formatDuration(callDuration || 0)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.callInfo}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={[styles.avatar, styles.activeAvatar]} />
            ) : (
              <MaterialIcons name="account-circle" size={140} color="#1f6feb" />
            )}
            <Text style={styles.callPartnerName}>
              {callState?.recipientName || callState?.callerName || 'In Call'}
            </Text>
            <Text style={styles.callDuration}>{formatDuration(callDuration || 0)}</Text>
          </View>
        )}

        <View style={[styles.callControls, callState.isVideo && styles.videoControls]}>
          <TouchableOpacity
            style={[styles.controlButton, !isMicEnabled && styles.disabledButton]}
            onPress={toggleMic}>
            <MaterialIcons
              name={isMicEnabled ? 'mic' : 'mic-off'}
              size={24}
              color={isMicEnabled ? '#333' : '#999'}
            />
          </TouchableOpacity>

          {callState.isVideo ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, !isVideoEnabled && styles.disabledButton]}
                onPress={toggleVideo}>
                <MaterialIcons
                  name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                  size={24}
                  color={isVideoEnabled ? '#333' : '#999'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <MaterialIcons name="flip-camera-ios" size={24} color="#333" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, !isSpeakerEnabled && styles.disabledButton]}
              onPress={toggleSpeaker}>
              <MaterialIcons
                name={isSpeakerEnabled ? 'volume-up' : 'volume-off'}
                size={24}
                color={isSpeakerEnabled ? '#333' : '#999'}
              />
            </TouchableOpacity>
          )}

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
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideo: {
    flex: 1,
  },
  remoteVideoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  waitingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#333',
    zIndex: 10,
  },
  localVideo: {
    flex: 1,
  },
  videoCallOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
  },
  videoPartnerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  videoDuration: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  videoControls: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
});

export default VoiceCallScreen;
