import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

interface OfflineBannerProps {
  isOffline: boolean;
  outboxCount: number;
  draftCount?: number;
  isSyncing?: boolean;
  onPressDrafts?: () => void;
  onPressSync?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOffline,
  outboxCount,
  draftCount = 0,
  isSyncing = false,
  onPressDrafts,
  onPressSync,
}) => {
  const theme = useTheme();

  if (!isOffline && outboxCount === 0 && draftCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(250)}
      style={[
        styles.container,
        {
          backgroundColor: isOffline
            ? '#D97706' // Warm amber warning for offline
            : isSyncing
            ? theme.colors.primary
            : '#2563EB', // Blue notice for pending outbox sync
        },
      ]}
    >
      <View style={styles.leftRow}>
        <Ionicons
          name={
            isSyncing
              ? 'cloud-upload-outline'
              : isOffline
              ? 'cloud-offline-outline'
              : 'time-outline'
          }
          size={18}
          color="#FFFFFF"
          style={styles.icon}
        />
        <View style={styles.textColumn}>
          <Text style={styles.titleText}>
            {isSyncing
              ? 'Syncing offline posts...'
              : isOffline
              ? 'You are offline (Browsing cached feed)'
              : 'Pending outbox items ready to sync'}
          </Text>
          {(outboxCount > 0 || draftCount > 0) && (
            <Text style={styles.subtitleText}>
              {outboxCount > 0 ? `${outboxCount} in outbox` : ''}
              {outboxCount > 0 && draftCount > 0 ? ' • ' : ''}
              {draftCount > 0 ? `${draftCount} draft${draftCount > 1 ? 's' : ''}` : ''}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionRow}>
        {(outboxCount > 0 || draftCount > 0) && onPressDrafts && (
          <TouchableOpacity
            style={styles.button}
            onPress={onPressDrafts}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>
        )}

        {!isOffline && outboxCount > 0 && !isSyncing && onPressSync && (
          <TouchableOpacity
            style={[styles.button, styles.syncButton]}
            onPress={onPressSync}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    zIndex: 99,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default OfflineBanner;
