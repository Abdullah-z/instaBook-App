import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DraftPost, OutboxPost } from '../utils/offlineSyncManager';

interface DraftsModalProps {
  visible: boolean;
  onClose: () => void;
  outboxItems: OutboxPost[];
  draftItems: DraftPost[];
  isOffline: boolean;
  isSyncing: boolean;
  onDeleteOutbox: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onSyncNow: () => void;
  onSelectDraftToEdit?: (draft: DraftPost) => void;
}

export const DraftsModal: React.FC<DraftsModalProps> = ({
  visible,
  onClose,
  outboxItems,
  draftItems,
  isOffline,
  isSyncing,
  onDeleteOutbox,
  onDeleteDraft,
  onSyncNow,
  onSelectDraftToEdit,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = React.useState<'outbox' | 'drafts'>('outbox');

  const renderOutboxItem = ({ item }: { item: OutboxPost }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.elevation.level2 }]}>
      <View style={styles.itemHeader}>
        <View style={styles.tagBadge}>
          <Ionicons name="cloud-upload-outline" size={12} color="#FFFFFF" />
          <Text style={styles.tagText}>Pending Sync</Text>
        </View>
        <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={[styles.itemText, { color: theme.colors.onSurface }]} numberOfLines={3}>
        {item.text || '(No text content)'}
      </Text>

      {item.images && item.images.length > 0 && (
        <View style={styles.imagePreviewRow}>
          {item.images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.thumbnail} />
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        {item.retryCount > 0 && (
          <Text style={styles.retryText}>
            Retry count: {item.retryCount}
          </Text>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert('Delete Pending Post', 'Are you sure you want to remove this post from outbox?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteOutbox(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDraftItem = ({ item }: { item: DraftPost }) => (
    <View style={[styles.itemCard, { backgroundColor: theme.colors.elevation.level2 }]}>
      <View style={styles.itemHeader}>
        <View style={[styles.tagBadge, { backgroundColor: '#6B7280' }]}>
          <Ionicons name="document-text-outline" size={12} color="#FFFFFF" />
          <Text style={styles.tagText}>Draft</Text>
        </View>
        <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>

      <Text style={[styles.itemText, { color: theme.colors.onSurface }]} numberOfLines={3}>
        {item.text || '(Empty draft)'}
      </Text>

      {item.images && item.images.length > 0 && (
        <View style={styles.imagePreviewRow}>
          {item.images.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.thumbnail} />
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        {onSelectDraftToEdit && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              onSelectDraftToEdit(item);
              onClose();
            }}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.editText, { color: theme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDeleteDraft(item.id) },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>
              Offline Outbox & Drafts
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.colors.onBackground} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.colors.elevation.level1 }]}>
            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'outbox' && { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setActiveTab('outbox')}
            >
              <Text style={[styles.tabLabel, { color: theme.colors.onSurface }]}>
                Outbox Queue ({outboxItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabItem,
                activeTab === 'drafts' && { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() => setActiveTab('drafts')}
            >
              <Text style={[styles.tabLabel, { color: theme.colors.onSurface }]}>
                Drafts ({draftItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sync status banner inside modal */}
          {!isOffline && outboxItems.length > 0 && (
            <View style={styles.syncBanner}>
              <Text style={styles.syncBannerText}>
                {isSyncing ? 'Syncing outbox items...' : 'Connected to internet. Ready to sync outbox.'}
              </Text>
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <TouchableOpacity style={styles.syncBtn} onPress={onSyncNow}>
                  <Ionicons name="cloud-upload" size={14} color="#FFFFFF" />
                  <Text style={styles.syncBtnText}>Sync Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content List */}
          {activeTab === 'outbox' ? (
            <FlatList
              data={outboxItems}
              keyExtractor={(item) => item.id}
              renderItem={renderOutboxItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.outline} />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    No pending outbox posts. Everything is synced!
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={draftItems}
              keyExtractor={(item) => item.id}
              renderItem={renderDraftItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={theme.colors.outline} />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    No saved drafts found.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  syncBanner: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  syncBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  syncBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagBadge: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 11,
  },
  itemText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
    marginTop: 4,
  },
  retryText: {
    fontSize: 11,
    color: '#D97706',
    marginRight: 'auto',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DraftsModal;
