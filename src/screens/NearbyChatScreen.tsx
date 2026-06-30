import { Image } from 'expo-image';
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Easing, StatusBar, Dimensions, ActivityIndicator, Alert, PermissionsAndroid, Switch } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
// Detect whether the real native module is loaded or we're in Expo Go
let isNativeAvailable = false;
try {
  const { requireNativeModule } = require('expo-modules-core');
  requireNativeModule('NearbyChat');
  isNativeAvailable = true;
} catch (_) {
  isNativeAvailable = false;
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import NearbyService, {
  NearbyPeer,
  NearbyMessage,
} from '../api/nearbyAPI';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type ChatView = 'radar' | 'dm' | 'room';

// ─── Radar ring component ─────────────────────────────────────────────────────
const RadarRing = ({ delay, size }: { delay: number; size: number }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;
  const theme = useTheme();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 0.3, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

// ─── Peer Avatar ──────────────────────────────────────────────────────────────
const PeerDot = ({
  peer,
  index,
  total,
  onPress,
}: {
  peer: NearbyPeer;
  index: number;
  total: number;
  onPress: () => void;
}) => {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const radius = 110;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const pulse = useRef(new Animated.Value(1)).current;
  const theme = useTheme();

  useEffect(() => {
    if (peer.status === 'connecting') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.25, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.setValue(1);
    }
  }, [peer.status]);

  const statusColor =
    peer.status === 'connected'
      ? '#00E676'
      : peer.status === 'connecting'
        ? theme.colors.secondary
        : theme.colors.primary;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: SCREEN_W / 2 + x - 30,
        top: SCREEN_H * 0.22 + y - 30,
        transform: [{ scale: pulse }],
      }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={[styles.peerDot, { backgroundColor: theme.colors.surfaceVariant, borderColor: statusColor, padding: peer.avatar ? 2 : 0 }]}>
          {peer.avatar ? (
            <Image
              source={{ uri: peer.avatar }}
              style={{ width: '100%', height: '100%', borderRadius: 26 }}
            />
          ) : (
            <Text style={[styles.peerInitial, { color: theme.colors.primary }]}>
              {peer.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={[styles.peerName, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {peer.name.split(' ')[0]}
        </Text>
        {peer.status === 'connected' && (
          <View style={[styles.connectedBadge, { backgroundColor: statusColor, borderColor: theme.colors.background }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, activeTransfers = {} }: { msg: NearbyMessage; activeTransfers?: Record<string, any> }) => {
  const theme = useTheme();
  const [imgError, setImgError] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveToGallery = async (uri: string) => {
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow storage access to save photos.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Photo saved to your gallery ✓');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not save photo');
    } finally {
      setSaving(false);
    }
  };

  let pct = 0;
  let isTransferring = false;
  if (msg.payloadId && activeTransfers[msg.payloadId]) {
    const transfer = activeTransfers[msg.payloadId];
    pct = transfer.totalBytes > 0 ? Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100) : 0;
    isTransferring = true;
  } else if (msg.payloadIds) {
    const activeList = msg.payloadIds.map(id => activeTransfers[id]).filter(Boolean);
    if (activeList.length > 0) {
      const totalBytes = activeList.reduce((acc, t) => acc + t.totalBytes, 0);
      const bytesTransferred = activeList.reduce((acc, t) => acc + t.bytesTransferred, 0);
      pct = totalBytes > 0 ? Math.round((bytesTransferred / totalBytes) * 100) : 0;
      isTransferring = true;
    }
  }

  const isIncomingPlaceholder = !msg.isOwn && msg.type !== 'text' && !msg.imageUri && !msg.fileUri;

  if (isTransferring || isIncomingPlaceholder) {
    return (
      <View
        style={[
          styles.bubble,
          msg.isOwn ? styles.bubbleOwn : styles.bubbleOther,
          { minWidth: 160 },
        ]}>
        {!msg.isOwn && (
          <Text style={[styles.bubbleSender, { color: theme.colors.primary, marginBottom: 4 }]}>
            {msg.senderName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
          <ActivityIndicator size="small" color={msg.isOwn ? theme.colors.onPrimary : theme.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurface }}>
              {msg.isOwn ? 'Sending' : 'Receiving'} {msg.type === 'image' ? 'photo' : 'file'}...
            </Text>
            {msg.fileName && (
              <Text numberOfLines={1} style={{ fontSize: 11, color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                {msg.fileName}
              </Text>
            )}
            <View style={{ height: 4, backgroundColor: msg.isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: '100%', backgroundColor: msg.isOwn ? theme.colors.onPrimary : theme.colors.primary }} />
            </View>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '800', color: msg.isOwn ? theme.colors.onPrimary : theme.colors.primary, minWidth: 35, textAlign: 'right' }}>
            {pct}%
          </Text>
        </View>
        <Text style={[styles.bubbleTime, { color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.7, marginTop: 4 }]}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }

  if (msg.type === 'image' && msg.imageUri && !imgError) {
    return (
      <View
        style={[
          styles.bubble,
          msg.isOwn ? styles.bubbleOwn : styles.bubbleOther,
          { backgroundColor: 'transparent', padding: 4 },
        ]}>
        {!msg.isOwn && (
          <Text style={[styles.bubbleSender, { color: theme.colors.primary, marginBottom: 4 }]}>
            {msg.senderName}
          </Text>
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() =>
            Alert.alert(
              'Photo',
              msg.isOwn ? 'This is your sent photo.' : 'Save this photo to your gallery?',
              msg.isOwn
                ? [{ text: 'OK' }]
                : [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Save to Gallery', onPress: () => saveToGallery(msg.imageUri!) },
                  ]
            )
          }>
          <Image
            source={{ uri: msg.imageUri }}
            style={{ width: 200, height: 200, borderRadius: 12 }}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
          {saving && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000060', borderRadius: 12 }}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.bubbleTime, { color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.7, marginTop: 4 }]}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!msg.isOwn && <Text style={{ color: theme.colors.primary, opacity: 0.7 }}> · hold to save</Text>}
        </Text>
      </View>
    );
  }

  if (msg.type === 'file') {
    const isOwn = msg.isOwn;
    const filename = msg.fileName || 'File';
    const openFile = async () => {
      const uri = msg.fileUri;
      if (!uri) {
        Alert.alert('Error', 'File URI not found');
        return;
      }
      try {
        await Sharing.shareAsync(uri);
      } catch (e: any) {
        Alert.alert('Error opening file', e?.message || String(e));
      }
    };

    return (
      <View
        style={[
          styles.bubble,
          styles.fileBubble,
          isOwn
            ? [styles.bubbleOwn, { backgroundColor: theme.colors.primary }]
            : [styles.bubbleOther, { backgroundColor: theme.colors.surface }],
        ]}>
        {!isOwn && (
          <Text style={[styles.bubbleSender, { color: theme.colors.secondary }]}>
            {msg.senderName}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={openFile}
            activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingVertical: 4 }}>
            <Ionicons name="document-text" size={32} color={isOwn ? theme.colors.onPrimary : theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: isOwn ? theme.colors.onPrimary : theme.colors.onSurface,
                  fontWeight: '700',
                  fontSize: 14,
                }}>
                {filename}
              </Text>
              <Text style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                Tap to open / share
              </Text>
            </View>
          </TouchableOpacity>
          {!isOwn && (
            <TouchableOpacity
              onPress={async () => {
                const uri = msg.fileUri;
                if (!uri) { Alert.alert('Error', 'File not available'); return; }
                try {
                  if (Platform.OS === 'android') {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
                      const newUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, '*/*');
                      await FileSystem.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                      Alert.alert('Saved', 'File saved to your device.');
                    }
                  } else {
                    await Sharing.shareAsync(uri);
                  }
                } catch (e: any) {
                  Alert.alert('Error', e?.message || 'Could not save file');
                }
              }}
              style={{
                backgroundColor: 'rgba(0,0,0,0.08)',
                borderRadius: 20,
                padding: 8,
              }}>
              <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.bubbleTime, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.7 }]}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubble,
        msg.isOwn
          ? [styles.bubbleOwn, { backgroundColor: theme.colors.primary }]
          : [styles.bubbleOther, { backgroundColor: theme.colors.surface }],
      ]}>
      {!msg.isOwn && (
        <Text style={[styles.bubbleSender, { color: theme.colors.secondary }]}>
          {msg.senderName}
        </Text>
      )}
      <Text style={[styles.bubbleText, { color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurface }]}>
        {msg.message}
      </Text>
      <Text style={[styles.bubbleTime, { color: msg.isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, opacity: 0.7 }]}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const NearbyChatScreen = () => {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [view, setView] = useState<ChatView>('radar');
  const [peers, setPeers] = useState<NearbyPeer[]>([]);
  const [messages, setMessages] = useState<NearbyMessage[]>([]);
  const [activePeer, setActivePeer] = useState<NearbyPeer | null>(null);
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(
    isNativeAvailable ? 'Tap scan to find nearby people' : 'Bluetooth unavailable in Expo Go'
  );
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [wifiRequired, setWifiRequired] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ uri: string }[]>([]);
  const [isHD, setIsHD] = useState(false);
  const [imageSending, setImageSending] = useState(false);
  const [imageSendingIndex, setImageSendingIndex] = useState<number | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const [savingAll, setSavingAll] = useState(false);
  const [activeTransfers, setActiveTransfers] = useState<Record<string, any>>({});

  const flatListRef = useRef<FlatList>(null);
  const sweepAnim = useRef(new Animated.Value(0)).current;
  const sweepLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ─── Load persisted messages on mount ──────────────────────────────────────
  useEffect(() => {
    NearbyService.loadMessages().then(() => {
      setMessages(NearbyService.getMessages());
    });

    const unsubs = [
      NearbyService.on('peer_found', () => {
        setPeers(NearbyService.getPeers());
        setScanStatus(`Found ${NearbyService.getPeers().length} person(s) nearby`);
      }),
      NearbyService.on('peer_lost', () => {
        setPeers(NearbyService.getPeers());
      }),
      NearbyService.on('connected', (peer: NearbyPeer) => {
        setPeers(NearbyService.getPeers());
        if (peer) {
          setActivePeer(peer);
          setView('dm');
        }
      }),
      NearbyService.on('disconnected', () => {
        setPeers(NearbyService.getPeers());
      }),
      NearbyService.on('message_received', () => {
        setMessages(NearbyService.getMessages());
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }),
      NearbyService.on('image_progress', (data: any) => {
        const { payloadId, bytesTransferred, totalBytes, status, direction } = data;
        setActiveTransfers((prev) => {
          const next = { ...prev };
          if (status === 'success' || status === 'failed') {
            delete next[payloadId];
          } else {
            next[payloadId] = { bytesTransferred, totalBytes, status, direction };
          }
          
          if (direction === 'outgoing') {
            const hasOutgoing = Object.values(next).some((t: any) => t.direction === 'outgoing');
            if (!hasOutgoing && (status === 'success' || status === 'failed')) {
              setImageSending(false);
              setImageProgress(0);
            } else if (totalBytes > 0) {
              const pct = Math.round((bytesTransferred / totalBytes) * 100);
              setImageProgress(pct);
            }
          }
          return next;
        });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  // ─── Radar sweep animation ──────────────────────────────────────────────────
  const startSweep = useCallback(() => {
    sweepLoop.current?.stop();
    sweepAnim.setValue(0);
    sweepLoop.current = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    sweepLoop.current.start();
  }, []);

  const stopSweep = useCallback(() => {
    sweepLoop.current?.stop();
    sweepAnim.setValue(0);
  }, []);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const apiLevel = parseInt(Platform.Version as string, 10);
      if (apiLevel >= 31) {
        const permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        if (apiLevel >= 33 && PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES) {
          permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
        }

        const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
        const allGranted = Object.values(granted).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED
        );
        if (!allGranted) {
          Alert.alert(
            'Permissions Required',
            'Nearby Chat needs Bluetooth, WiFi, and Location permissions to find people around you. Please grant them in Settings.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Location permission is required to discover nearby devices.');
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('[NearbyChat] Permission request error:', e);
      return false;
    }
  };

  const handleScan = async () => {
    if (!isNativeAvailable) {
      Alert.alert(
        'Native Build Required',
        'Bluetooth peer discovery only works in a native dev build.\n\nRun:\n  npx expo run:android\n\nThis compiles the Bluetooth module and installs a custom APK on your device.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (isScanning) {
      await NearbyService.stop();
      setIsScanning(false);
      setScanStatus('Tap scan to find nearby people');
      setNativeError(null);
      setWifiRequired(false);
      stopSweep();
      setPeers([]);
    } else {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      setNativeError(null);
      setWifiRequired(false);
      const username = user?.username || user?.fullname || 'Anonymous';
      const avatarUrl = user?.avatar || '';
      const advertiseName = `${username}|${avatarUrl}`;
      setScanStatus('Starting nearby services...');
      setIsScanning(true);
      startSweep();
      try {
        await NearbyService.start(advertiseName);
        setScanStatus('Scanning — keep screens on and stay close');
      } catch (e: any) {
        const msg: string = e?.message || String(e);
        if (msg.includes('WIFI_REQUIRED')) {
          setWifiRequired(true);
          setScanStatus('WiFi radio required — see below');
        } else {
          setNativeError(msg);
          setScanStatus('Failed to start — see error below');
        }
        setIsScanning(false);
        stopSweep();
        console.error('[NearbyChat] handleScan error:', msg);
      }
    }
  };

  const handlePeerPress = (peer: NearbyPeer) => {
    if (peer.status === 'connected') {
      setActivePeer(peer);
      setView('dm');
    } else if (peer.status === 'discovered') {
      Alert.alert(
        `Connect to ${peer.name}?`,
        'This will establish a direct Bluetooth connection for private messaging.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => NearbyService.connectToPeer(peer.endpointId) },
        ]
      );
    }
  };

  const connectedPeers = peers.filter((p) => p.status === 'connected');

  const pickImage = async () => {
    const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
    if (!canSend) {
      Alert.alert(
        'Not Connected',
        'You must be connected to a peer or in the community room to send images.'
      );
      return;
    }

    if (pendingImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can select up to 10 images at a time.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - pendingImages.length,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selected = result.assets.map(asset => ({ uri: asset.uri }));
        setPendingImages(prev => [...prev, ...selected].slice(0, 10));
      }
    } catch (e: any) {
      Alert.alert('Error picking photo', e?.message || String(e));
    }
  };

  const takePhoto = async () => {
    const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
    if (!canSend) {
      Alert.alert(
        'Not Connected',
        'You must be connected to a peer or in the community room to send photos.'
      );
      return;
    }

    if (pendingImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can select up to 10 images at a time.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to snap photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const snapped = result.assets.map(asset => ({ uri: asset.uri }));
        setPendingImages(prev => [...prev, ...snapped].slice(0, 10));
      }
    } catch (e: any) {
      Alert.alert('Error taking photo', e?.message || String(e));
    }
  };

  const pickDocument = async () => {
    const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
    if (!canSend) {
      Alert.alert(
        'Not Connected',
        'You must be connected to a peer or in the community room to send files.'
      );
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        Alert.alert(
          'Send File',
          `Do you want to send "${asset.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send',
              onPress: async () => {
                setImageSending(true);
                setImageProgress(0);
                try {
                  const filename = asset.name;
                  const destPath = `${FileSystem.cacheDirectory}${Date.now()}_${filename}`;
                  await FileSystem.copyAsync({ from: asset.uri, to: destPath });

                  if (view === 'dm' && activePeer) {
                    await NearbyService.sendFile(activePeer.endpointId, destPath, filename);
                  } else if (view === 'room') {
                    await NearbyService.broadcastFile(destPath, filename);
                  }
                } catch (e: any) {
                  Alert.alert('Send Failed', e?.message || 'Failed to send file');
                  setImageSending(false);
                  setImageProgress(0);
                }
              }
            }
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('Error picking document', e?.message || String(e));
    }
  };

  const saveAllToGallery = async () => {
    const imagesToSave = visibleMessages.filter(
      (m) => m.type === 'image' && !m.isOwn && m.imageUri
    );
    if (imagesToSave.length === 0) return;

    try {
      setSavingAll(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow storage access to save photos.');
        return;
      }

      for (const msg of imagesToSave) {
        if (msg.imageUri) {
          await MediaLibrary.saveToLibraryAsync(msg.imageUri);
        }
      }
      Alert.alert('Saved All', `Successfully saved all ${imagesToSave.length} photos to your gallery! ✓`);
    } catch (e: any) {
      Alert.alert('Error saving', e?.message || 'Could not save photos');
    } finally {
      setSavingAll(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    const hasPendingImages = pendingImages.length > 0;
    if (!text && !hasPendingImages) return;

    setInputText('');

    if (hasPendingImages) {
      setImageSending(true);
      try {
        for (let i = 0; i < pendingImages.length; i++) {
          setImageSendingIndex(i);
          setImageProgress(0);

          const item = pendingImages[i];
          let destUri = '';
          if (isHD) {
            destUri = item.uri;
          } else {
            const manipResult = await ImageManipulator.manipulateAsync(
              item.uri,
              [{ resize: { width: 1080 } }],
              { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
            );
            destUri = manipResult.uri;
          }

          const filename = `nearby_send_${Date.now()}_${i}.jpg`;
          const destPath = `${FileSystem.cacheDirectory}${filename}`;
          await FileSystem.copyAsync({ from: destUri, to: destPath });

          if (view === 'dm' && activePeer) {
            await NearbyService.sendImage(activePeer.endpointId, destPath);
          } else if (view === 'room') {
            await NearbyService.broadcastImage(destPath);
          }

          await new Promise(resolve => setTimeout(resolve, 800));
        }

        setPendingImages([]);
        setIsHD(false);
      } catch (e: any) {
        Alert.alert('Send Failed', e?.message || 'Failed to send one or more images');
        setImageSending(false);
        setImageSendingIndex(null);
        setImageProgress(0);
      }
    }

    if (text) {
      if (view === 'dm' && activePeer) {
        await NearbyService.sendMessage(activePeer.endpointId, text);
      } else if (view === 'room') {
        await NearbyService.sendBroadcast(text);
      }
    }
  };

  const visibleMessages =
    view === 'dm' && activePeer
      ? messages.filter(
          (m) =>
            (m.isOwn && m.targetId === activePeer.endpointId) ||
            (!m.isOwn && m.senderId === activePeer.endpointId)
        )
      : view === 'room'
        ? messages.filter((m) => m.targetId === 'room')
        : [];

  const sweepRotation = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={() => {
            if (view !== 'radar') {
              setView('radar');
              setActivePeer(null);
            } else {
              navigation.goBack();
            }
          }}
          style={[styles.backBtn, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {view === 'dm' && activePeer ? activePeer.name : view === 'room' ? 'Community Room' : 'Nearby Chat'}
          </Text>
          <Text style={[styles.headerSub, { color: theme.colors.onSurfaceVariant }]}>
            {view === 'radar'
              ? 'Nearby · P2P Offline Chat'
              : view === 'room'
                ? `👥 ${connectedPeers.length + 1} users in local mesh`
                : activePeer?.status === 'connected'
                  ? '🔵 Connected'
                  : 'Nearby DM'}
          </Text>
        </View>

        {view !== 'radar' && (
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setView('radar')}
              style={[styles.tabBtn, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
              <Ionicons name="radio" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── RADAR VIEW ── */}
      {view === 'radar' && (
        <View style={styles.radarSection}>
          <View style={styles.radarCenter}>
            <RadarRing delay={0} size={320} />
            <RadarRing delay={800} size={220} />
            <RadarRing delay={1600} size={120} />

            {isScanning && (
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 320,
                  height: 320,
                  transform: [{ rotate: sweepRotation }],
                }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 160,
                    top: 159,
                    width: 155,
                    height: 2,
                    backgroundColor: theme.colors.primary,
                    opacity: 0.8,
                    borderRadius: 1,
                  }}
                />
              </Animated.View>
            )}

            <View style={[styles.centerPulse, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.primary }]}>
              <Ionicons name="radio" size={28} color={theme.colors.primary} />
            </View>
          </View>

          {peers.map((peer, i) => (
            <PeerDot
              key={peer.endpointId}
              peer={peer}
              index={i}
              total={Math.max(peers.length, 1)}
              onPress={() => handlePeerPress(peer)}
            />
          ))}

          {!isNativeAvailable && (
            <View style={styles.expoGoBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF9800" />
              <Text style={styles.expoGoBannerText}>
                Expo Go mode — run{' '}
                <Text style={{ fontWeight: '900' }}>npx expo run:android</Text>
                {' '}for real Bluetooth
              </Text>
            </View>
          )}

          {permissionDenied && (
            <View style={[styles.expoGoBanner, { borderColor: '#F44336' }]}>
              <Ionicons name="close-circle-outline" size={16} color="#F44336" />
              <Text style={[styles.expoGoBannerText, { color: '#F44336' }]}>
                Nearby permissions denied — check Settings
              </Text>
            </View>
          )}

          {wifiRequired && (
            <View style={[styles.expoGoBanner, { borderColor: '#FF9800', backgroundColor: '#FF980015', flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="wifi-outline" size={18} color="#FF9800" />
                <Text style={[styles.expoGoBannerText, { color: '#FF9800', fontWeight: '800', fontSize: 13 }]}>
                  Turn WiFi ON (no internet needed)
                </Text>
              </View>
              <Text style={[styles.expoGoBannerText, { color: '#FFB74D', marginTop: 6 }]}>
                Nearby Chat uses <Text style={{ fontWeight: '800' }}>WiFi Direct (P2P)</Text> hardware to connect devices.{'\n\n'}
                1. Open Quick Settings{'\n'}
                2. Tap WiFi to turn it ON{'\n'}
                3. You do NOT need to join any network{'\n'}
                4. Tap Start Scanning again
              </Text>
            </View>
          )}

          {nativeError && (
            <View style={[styles.expoGoBanner, { borderColor: '#F44336', backgroundColor: '#F4433610' }]}>
              <Ionicons name="alert-circle-outline" size={16} color="#F44336" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.expoGoBannerText, { color: '#F44336', fontWeight: '700' }]}>
                  Nearby API Error
                </Text>
                <Text style={[styles.expoGoBannerText, { color: '#FF8A80', marginTop: 2 }]}>
                  {nativeError}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.scanStatus}>{scanStatus}</Text>

          {/* Group Chat & Peers list below radar */}
          <View style={styles.peerList}>
            {isScanning && (
              <TouchableOpacity
                style={[styles.roomBtn, { backgroundColor: theme.colors.secondary }]}
                activeOpacity={0.8}
                onPress={() => setView('room')}>
                <Ionicons name="people" size={20} color={theme.colors.onSecondary} />
                <Text style={[styles.roomBtnText, { color: theme.colors.onSecondary }]}>Open Community Room</Text>
              </TouchableOpacity>
            )}

            {peers.map((peer) => (
              <TouchableOpacity
                key={peer.endpointId}
                style={[
                  styles.peerRow,
                  {
                    backgroundColor:
                      peer.status === 'connected'
                        ? 'rgba(0,230,118,0.1)'
                        : theme.colors.surfaceVariant,
                    borderColor:
                      peer.status === 'connected' ? '#00E676' : theme.colors.outlineVariant,
                  },
                ]}
                onPress={() => handlePeerPress(peer)}>
                <View
                  style={[
                    styles.peerRowAvatar,
                    {
                      backgroundColor:
                        peer.status === 'connected' ? '#00E676' : theme.colors.primary,
                      padding: peer.avatar ? 2 : 0,
                    },
                  ]}>
                  {peer.avatar ? (
                    <Image
                      source={{ uri: peer.avatar }}
                      style={{ width: '100%', height: '100%', borderRadius: 22 }}
                    />
                  ) : (
                    <Text style={{ color: theme.colors.onPrimary, fontWeight: '900', fontSize: 16 }}>
                      {peer.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: theme.colors.onSurface, fontWeight: '700', fontSize: 15 }}>
                    {peer.name}
                  </Text>
                  <Text style={{ color: peer.status === 'connected' ? '#00E676' : theme.colors.primary, fontSize: 12, marginTop: 2 }}>
                    {peer.status === 'connected'
                      ? '✓ Connected — tap to chat'
                      : peer.status === 'connecting'
                        ? '⟳ Connecting...'
                        : '● Nearby — tap to connect'}
                  </Text>
                </View>
                <Ionicons
                  name={peer.status === 'connected' ? 'chatbubble' : 'add-circle-outline'}
                  size={22}
                  color={peer.status === 'connected' ? '#00E676' : theme.colors.primary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Scan button */}
          <TouchableOpacity
            style={[
              styles.scanBtn,
              {
                backgroundColor: !isNativeAvailable
                  ? theme.colors.surfaceVariant
                  : isScanning
                    ? theme.colors.error
                    : theme.colors.primary,
              },
              { bottom: insets.bottom + 24 },
            ]}
            onPress={handleScan}
            activeOpacity={0.85}>
            {isScanning ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.scanBtnText}>Stop Scanning</Text>
              </>
            ) : !isNativeAvailable ? (
              <>
                <Ionicons name="warning-outline" size={20} color={theme.colors.error} style={{ marginRight: 8 }} />
                <Text style={[styles.scanBtnText, { color: theme.colors.error }]}>Build Required</Text>
              </>
            ) : (
              <>
                <Ionicons name="radio" size={20} color={theme.colors.onPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.scanBtnText, { color: theme.colors.onPrimary }]}>Start Scanning</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── CHAT VIEW (DM & ROOM) ── */}
      {(view === 'dm' || view === 'room') && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>

          {/* ── Room banner ── */}
          {view === 'room' && (
            <View style={styles.roomBanner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={styles.roomBannerLeft}>
                  <Ionicons name="people" size={20} color={theme.colors.secondary} />
                  <Text style={[styles.roomBannerText, { color: theme.colors.secondary }]}>Community Room</Text>
                  <View style={[styles.roomMemberBadge, { backgroundColor: theme.colors.secondary }]}>
                    <Text style={[styles.roomMemberBadgeText, { color: theme.colors.onSecondary }]}>
                      {connectedPeers.length + 1}
                    </Text>
                  </View>
                </View>
                {visibleMessages.filter(m => m.type === 'image' && !m.isOwn && m.imageUri).length > 0 && (
                  <TouchableOpacity
                    onPress={saveAllToGallery}
                    style={[styles.saveAllBtn, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant }]}
                    disabled={savingAll}>
                    {savingAll ? (
                      <ActivityIndicator size="small" color={theme.colors.secondary} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={15} color={theme.colors.secondary} />
                        <Text style={[styles.saveAllText, { color: theme.colors.secondary }]}>
                          Save All ({visibleMessages.filter(m => m.type === 'image' && !m.isOwn && m.imageUri).length})
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.roomBannerSub, { color: theme.colors.onSurfaceVariant }]}>
                Broadcasts to all connected devices in your offline range
              </Text>

              {/* Connected member shortcuts */}
              {connectedPeers.length > 0 && (
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                  <Text style={{ color: theme.colors.secondary, fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Tap to private chat:
                  </Text>
                  <FlatList
                    horizontal
                    data={connectedPeers}
                    keyExtractor={(item) => item.endpointId}
                    contentContainerStyle={{ gap: 10, paddingBottom: 2 }}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setActivePeer(item);
                          setView('dm');
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.outlineVariant, gap: 6 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.secondary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                          {item.avatar ? (
                            <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <Text style={{ color: theme.colors.onSecondary, fontSize: 10, fontWeight: '900' }}>
                              {item.name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: theme.colors.onSurface, fontSize: 11, fontWeight: '700' }}>{item.name.split(' ')[0]}</Text>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#00E676' }} />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          )}

          {/* ── DM banner ── */}
          {view === 'dm' && activePeer && (
            <View style={styles.dmBanner}>
              <View style={[styles.dmAvatarCircle, { padding: activePeer.avatar ? 2 : 0, borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceVariant }]}>
                {activePeer.avatar ? (
                  <Image
                    source={{ uri: activePeer.avatar }}
                    style={{ width: '100%', height: '100%', borderRadius: 18 }}
                  />
                ) : (
                  <Text style={[styles.dmAvatarInitial, { color: theme.colors.primary }]}>
                    {activePeer.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.dmBannerName, { color: theme.colors.onSurface }]}>{activePeer.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View
                    style={[
                      styles.dmStatusDot,
                      {
                        backgroundColor:
                          activePeer.status === 'connected' ? '#00E676' : theme.colors.secondary,
                      },
                    ]}
                  />
                  <Text style={[styles.dmStatusText, { color: theme.colors.onSurfaceVariant }]}>
                    {activePeer.status === 'connected'
                      ? 'Connected · Direct Message'
                      : activePeer.status === 'connecting'
                        ? 'Connecting...'
                        : 'Disconnected'}
                  </Text>
                </View>
              </View>

              {/* Reconnect button for disconnected peers */}
              {activePeer.status !== 'connected' && activePeer.status !== 'connecting' && (
                <TouchableOpacity
                  onPress={() => NearbyService.connectToPeer(activePeer.endpointId)}
                  style={[styles.saveAllBtn, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceVariant, marginRight: 8 }]}>
                  <Ionicons name="refresh" size={15} color={theme.colors.secondary} />
                  <Text style={[styles.saveAllText, { color: theme.colors.secondary }]}>Reconnect</Text>
                </TouchableOpacity>
              )}

              {visibleMessages.filter(m => m.type === 'image' && !m.isOwn && m.imageUri).length > 0 && (
                <TouchableOpacity
                  onPress={saveAllToGallery}
                  style={styles.saveAllBtn}
                  disabled={savingAll}>
                  {savingAll ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={15} color={theme.colors.primary} />
                      <Text style={[styles.saveAllText, { color: theme.colors.primary }]}>
                        Save All ({visibleMessages.filter(m => m.type === 'image' && !m.isOwn && m.imageUri).length})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Inline Image Transfer Progress Banner */}
          {imageSending && (
            <View style={{ backgroundColor: theme.colors.surfaceVariant, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.onSurface, fontSize: 13, fontWeight: '700' }}>
                  Sending image {imageSendingIndex! + 1} of {pendingImages.length}
                </Text>
                <View style={{ height: 4, backgroundColor: theme.colors.background, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${imageProgress}%`, height: '100%', backgroundColor: theme.colors.primary }} />
                </View>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '800', minWidth: 35, textAlign: 'right' }}>
                {imageProgress}%
              </Text>
            </View>
          )}

          {visibleMessages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons
                name={view === 'room' ? 'people-outline' : 'chatbubbles-outline'}
                size={60}
                color={view === 'room' ? theme.colors.secondary : theme.colors.primary}
                style={{ opacity: 0.3 }}
              />
              <Text style={[styles.emptyChatText, { color: theme.colors.onSurfaceVariant }]}>
                {view === 'room' 
                  ? 'Send a broadcast to everyone connected!'
                  : `Say hi to ${activePeer?.name}!`}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={visibleMessages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble msg={item} activeTransfers={activeTransfers} />}
              contentContainerStyle={styles.messageList}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {/* Pending images preview strip */}
          {pendingImages.length > 0 && (
            <View style={[
              styles.imagePreviewStrip,
              { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant },
            ]}>
              <FlatList
                horizontal
                data={pendingImages}
                keyExtractor={(item, index) => `${item.uri}-${index}`}
                contentContainerStyle={{ gap: 10, paddingRight: 10 }}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => {
                  const isSendingActive = imageSending && imageSendingIndex === index;
                  return (
                    <View style={styles.imagePreviewItem}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.imagePreviewThumb}
                      />
                      {isSendingActive && (
                        <View style={styles.imagePreviewOverlay}>
                          {imageProgress > 0 ? (
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900' }}>
                              {imageProgress}%
                            </Text>
                          ) : (
                            <ActivityIndicator color="#fff" size="small" />
                          )}
                        </View>
                      )}
                      {imageSending && !isSendingActive && imageSendingIndex !== null && index < imageSendingIndex && (
                        <View style={[styles.imagePreviewOverlay, { backgroundColor: '#000000A0' }]}>
                          <Ionicons name="checkmark-circle" size={24} color="#00E676" />
                        </View>
                      )}
                      {imageSending && !isSendingActive && imageSendingIndex !== null && index > imageSendingIndex && (
                        <View style={[styles.imagePreviewOverlay, { backgroundColor: '#00000070' }]}>
                          <Ionicons name="time" size={20} color={theme.colors.secondary} />
                        </View>
                      )}
                      {!imageSending && (
                        <TouchableOpacity
                          style={styles.imagePreviewRemove}
                          onPress={() => setPendingImages(prev => prev.filter((_, i) => i !== index))}>
                          <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
              />
              <View style={{ justifyContent: 'center', minWidth: 100 }}>
                <Text style={[styles.imagePreviewLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {imageSending 
                    ? `Sending ${imageSendingIndex! + 1}/${pendingImages.length}...`
                    : `${pendingImages.length}/10 chosen`}
                </Text>
              </View>
            </View>
          )}

          {/* ── Input bar ── */}
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: theme.colors.surface,
                borderTopColor: theme.colors.outlineVariant,
                paddingBottom: insets.bottom || 12,
              },
            ]}>
            <View style={styles.actionRow}>
            {/* Camera snap button */}
            {(() => {
              const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
              const accentColor = theme.colors.primary;
              return (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: canSend ? theme.colors.surfaceVariant : theme.colors.background,
                      marginRight: 2,
                      opacity: canSend ? 1 : 0.38,
                    },
                  ]}
                  onPress={takePhoto}
                  disabled={imageSending}>
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color={canSend ? accentColor : theme.colors.outline}
                  />
                </TouchableOpacity>
              );
            })()}

            {/* Document pick button */}
            {(() => {
              const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
              const accentColor = theme.colors.primary;
              return (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: canSend ? theme.colors.surfaceVariant : theme.colors.background,
                      marginRight: 2,
                      opacity: canSend ? 1 : 0.38,
                    },
                  ]}
                  onPress={pickDocument}
                  disabled={imageSending}>
                  <Ionicons
                    name="attach-outline"
                    size={20}
                    color={canSend ? accentColor : theme.colors.outline}
                  />
                </TouchableOpacity>
              );
            })()}

            {/* Image pick button */}
            {(() => {
              const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
              const accentColor = theme.colors.primary;
              return (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: canSend ? theme.colors.surfaceVariant : theme.colors.background,
                      marginRight: 2,
                      opacity: canSend ? 1 : 0.38,
                    },
                  ]}
                  onPress={pickImage}
                  disabled={imageSending}>
                  <Ionicons
                    name={pendingImages.length > 0 ? 'image' : 'image-outline'}
                    size={20}
                    color={pendingImages.length > 0 ? accentColor : canSend ? accentColor : theme.colors.outline}
                  />
                </TouchableOpacity>
              );
            })()}

            {/* HD Toggle */}
            {(() => {
              const canSend = (view === 'dm' && activePeer?.status === 'connected') || view === 'room';
              if (!canSend) return null;
              const accentColor = theme.colors.primary;
              return (
                <View style={[styles.hdToggleContainer, { backgroundColor: theme.colors.surfaceVariant, marginRight: 2 }]}>
                  <Text style={[styles.hdToggleText, { color: isHD ? accentColor : theme.colors.outline, marginRight: 4 }]}>
                    HD
                  </Text>
                  <Switch
                    value={isHD}
                    onValueChange={setIsHD}
                    disabled={imageSending}
                    trackColor={{ false: theme.colors.background, true: accentColor }}
                    thumbColor={isHD ? theme.colors.onPrimary : theme.colors.outline}
                    style={{ transform: [{ scaleX: 0.65 }, { scaleY: 0.65 }] }}
                  />
                </View>
              );
            })()}
            </View>
            <View style={styles.textInputRow}>
            <TextInput
              style={[
                styles.input,
                { color: theme.colors.onSurface, backgroundColor: theme.colors.background },
              ]}
              placeholder={view === 'room' ? 'Message Community Room...' : `Message ${activePeer?.name ?? ''}...`}
              placeholderTextColor={theme.colors.outline}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            {/* Send button */}
            {(() => {
              const hasContent = inputText.trim().length > 0 || pendingImages.length > 0;
              const accentColor = theme.colors.primary;
              return (
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    { backgroundColor: hasContent && !imageSending ? accentColor : theme.colors.surfaceVariant },
                  ]}
                  onPress={handleSend}
                  disabled={!hasContent || imageSending}>
                  {imageSending ? (
                    <ActivityIndicator size="small" color={accentColor} />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color={hasContent ? theme.colors.onPrimary : theme.colors.outline}
                    />
                  )}
                </TouchableOpacity>
              );
            })()}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

export default NearbyChatScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00E5FF12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: '#4A6272',
    fontSize: 12,
    marginTop: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0D1B26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00E5FF30',
  },
  tabBtnActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },

  // ── Radar
  radarSection: {
    flex: 1,
    alignItems: 'center',
  },
  radarCenter: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  sweepWrapper: {
    position: 'absolute',
  },
  sweepLine: {
    width: 0,
  },
  centerPulse: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00E5FF15',
    borderWidth: 2,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanStatus: {
    color: '#4A6272',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  expoGoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF980040',
    backgroundColor: '#FF980012',
    marginHorizontal: 20,
  },
  expoGoBannerText: {
    color: '#FF9800',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  // Peer dot on radar
  peerDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D2233',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peerInitial: {
    color: '#00E5FF',
    fontSize: 20,
    fontWeight: '900',
  },
  peerName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '700',
  },
  connectedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#050A0F',
  },

  // Peer list
  peerList: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  peerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 6,
  },
  peerRowAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD740',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  roomBtnText: {
    color: '#050A0F',
    fontWeight: '900',
    fontSize: 15,
  },

  // Scan button
  scanBtn: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    elevation: 8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  scanBtnText: {
    fontWeight: '900',
    fontSize: 16,
    color: '#fff',
  },

  // ── Chat — Room (amber) and DM (cyan) banners
  roomBanner: {
    backgroundColor: '#FFD74010',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD74025',
    gap: 4,
  },
  roomBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomBannerText: {
    color: '#FFD740',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  roomMemberBadge: {
    backgroundColor: '#FFD740',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  roomMemberBadgeText: {
    color: '#050A0F',
    fontSize: 10,
    fontWeight: '900',
  },
  roomBannerSub: {
    color: '#9E8A30',
    fontSize: 11,
    marginTop: 2,
    marginLeft: 26,
  },
  // DM banner
  dmBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF0D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#00E5FF20',
  },
  dmAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00E5FF20',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmAvatarInitial: {
    color: '#00E5FF',
    fontSize: 16,
    fontWeight: '900',
  },
  dmBannerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  dmStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dmStatusText: {
    color: '#4A6272',
    fontSize: 11,
  },
  // Image preview strip
  imagePreviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  imagePreviewItem: {
    position: 'relative',
  },
  imagePreviewThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  imagePreviewOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00000070',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  imagePreviewLabel: {
    fontSize: 12,
    flex: 1,
    opacity: 0.7,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyChatText: {
    color: '#4A6272',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '78%',
    minWidth: 180,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  fileBubble: {
    minWidth: 220,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'column',
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hdToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2233',
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 2,
    height: 46,
    justifyContent: 'center',
  },
  hdToggleText: {
    fontSize: 10,
    fontWeight: '900',
  },
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF15',
    borderWidth: 1,
    borderColor: '#00E5FF30',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  saveAllText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
});
