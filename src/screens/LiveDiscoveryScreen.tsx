import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'react-native-paper';
import { getActiveStreamsAPI, LiveStream } from '../api/liveAPI';

const PulsingDot = () => {
  const scale = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.pulseDot, { transform: [{ scale }] }]} />
  );
};

const LiveDiscoveryScreen = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStreams = async () => {
    try {
      const data = await getActiveStreamsAPI();
      setStreams(data);
    } catch (err) {
      console.error('Failed to fetch active streams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Poll every 10s for new streams
    const interval = setInterval(fetchStreams, 10000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStreams();
  };

  const formatElapsed = (startedAt: string) => {
    const seconds = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m`;
    return 'Just started';
  };

  const renderStream = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('LiveViewer', { stream: item })}
    >
      {/* Thumbnail / Avatar area */}
      <View style={styles.thumbnailContainer}>
        {item.hostAvatar ? (
          <Image source={{ uri: item.hostAvatar }} style={styles.thumbnail} contentFit="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="person" size={40} color="rgba(255,255,255,0.4)" />
          </View>
        )}
        {/* Live overlay */}
        <View style={styles.liveOverlay}>
          <View style={styles.liveChip}>
            <PulsingDot />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <View style={styles.viewerBadge}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={styles.viewerCount}>{item.viewerCount}</Text>
          </View>
        </View>
        {/* Elapsed time */}
        <View style={styles.elapsedBadge}>
          <Text style={styles.elapsedText}>{formatElapsed(item.startedAt)}</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.infoRow}>
        {item.hostAvatar ? (
          <Image source={{ uri: item.hostAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color={theme.colors.onSurfaceVariant} />
          </View>
        )}
        <View style={styles.infoText}>
          <Text style={[styles.hostName, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {item.hostName}
          </Text>
          <Text style={[styles.hostSub, { color: theme.colors.onSurfaceVariant }]}>
            {item.viewerCount} watching now
          </Text>
        </View>
        <TouchableOpacity
          style={styles.watchBtn}
          onPress={() => navigation.navigate('LiveViewer', { stream: item })}
        >
          <Text style={styles.watchBtnText}>Watch</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="radio-outline" size={64} color={theme.colors.onSurfaceVariant} />
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>No Live Streams</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Nobody is live right now.{'\n'}Go live yourself!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Finding live streams...
          </Text>
        </View>
      ) : (
        <FlatList
          data={streams}
          keyExtractor={(item) => item.channelName}
          renderItem={renderStream}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={streams.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default LiveDiscoveryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 16 },
  emptyList: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 15 },

  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    marginBottom: 4,
  },

  thumbnailContainer: { position: 'relative', height: 200 },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },

  liveOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 5,
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },

  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  viewerCount: { color: '#fff', fontSize: 12, fontWeight: '600' },

  elapsedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  elapsedText: { color: '#fff', fontSize: 11 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1 },
  hostName: { fontWeight: '700', fontSize: 14 },
  hostSub: { fontSize: 12, marginTop: 2 },

  watchBtn: {
    backgroundColor: '#E53935',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  watchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
