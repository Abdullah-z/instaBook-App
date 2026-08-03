import AsyncStorage from '@react-native-async-storage/async-storage';

const FEED_CACHE_KEY = '@offline_feed_posts';
const STORIES_CACHE_KEY = '@offline_stories';
const DRAFTS_KEY = '@post_drafts';
const OUTBOX_KEY = '@post_outbox';

export interface DraftPost {
  id: string;
  text: string;
  images?: string[];
  privacy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxPost {
  id: string;
  formData: any;
  text: string;
  images?: string[];
  privacy?: string;
  createdAt: string;
  retryCount: number;
}

/**
 * Feed Caching Utilities
 */
export const saveCachedFeed = async (posts: any[]): Promise<void> => {
  try {
    if (!posts || !Array.isArray(posts)) return;
    // Keep last 30 posts cached
    const trimmed = posts.slice(0, 30);
    await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[OfflineSyncManager] Error saving feed cache:', error);
  }
};

export const getCachedFeed = async (): Promise<any[]> => {
  try {
    const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('[OfflineSyncManager] Error getting cached feed:', error);
    return [];
  }
};

export const saveCachedStories = async (stories: any[]): Promise<void> => {
  try {
    if (!stories || !Array.isArray(stories)) return;
    await AsyncStorage.setItem(STORIES_CACHE_KEY, JSON.stringify(stories));
  } catch (error) {
    console.error('[OfflineSyncManager] Error saving stories cache:', error);
  }
};

export const getCachedStories = async (): Promise<any[]> => {
  try {
    const cached = await AsyncStorage.getItem(STORIES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('[OfflineSyncManager] Error getting cached stories:', error);
    return [];
  }
};

/**
 * Drafts Management Utilities
 */
export const saveDraft = async (draftData: Omit<DraftPost, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<DraftPost> => {
  try {
    const drafts = await getDrafts();
    const now = new Date().toISOString();
    const id = draftData.id || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const existingIndex = drafts.findIndex((d) => d.id === id);
    const updatedDraft: DraftPost = {
      ...draftData,
      id,
      createdAt: existingIndex >= 0 ? drafts[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = updatedDraft;
    } else {
      drafts.unshift(updatedDraft);
    }

    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    return updatedDraft;
  } catch (error) {
    console.error('[OfflineSyncManager] Error saving draft:', error);
    throw error;
  }
};

export const getDrafts = async (): Promise<DraftPost[]> => {
  try {
    const data = await AsyncStorage.getItem(DRAFTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[OfflineSyncManager] Error getting drafts:', error);
    return [];
  }
};

export const deleteDraft = async (draftId: string): Promise<void> => {
  try {
    const drafts = await getDrafts();
    const filtered = drafts.filter((d) => d.id !== draftId);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[OfflineSyncManager] Error deleting draft:', error);
  }
};

/**
 * Outbox Management Utilities (Pending Posts to Sync Online)
 */
export const addToOutbox = async (postData: {
  text: string;
  images?: string[];
  privacy?: string;
  postPayload?: any;
}): Promise<OutboxPost> => {
  try {
    const outbox = await getOutbox();
    const id = `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newOutboxItem: OutboxPost = {
      id,
      text: postData.text,
      images: postData.images || [],
      privacy: postData.privacy || 'public',
      formData: postData.postPayload || {},
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    outbox.unshift(newOutboxItem);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    return newOutboxItem;
  } catch (error) {
    console.error('[OfflineSyncManager] Error adding to outbox:', error);
    throw error;
  }
};

export const getOutbox = async (): Promise<OutboxPost[]> => {
  try {
    const data = await AsyncStorage.getItem(OUTBOX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[OfflineSyncManager] Error getting outbox:', error);
    return [];
  }
};

export const removeFromOutbox = async (id: string): Promise<void> => {
  try {
    const outbox = await getOutbox();
    const filtered = outbox.filter((item) => item.id !== id);
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[OfflineSyncManager] Error removing from outbox:', error);
  }
};

/**
 * Outbox Sync Execution
 */
export const syncOutbox = async (
  createPostApi: (postItem: OutboxPost) => Promise<any>
): Promise<{ successCount: number; failCount: number }> => {
  const outbox = await getOutbox();
  if (outbox.length === 0) return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  for (const item of [...outbox]) {
    try {
      await createPostApi(item);
      await removeFromOutbox(item.id);
      successCount++;
    } catch (error) {
      console.error(`[OfflineSyncManager] Failed to sync outbox post ${item.id}:`, error);
      failCount++;
      // Increment retry count
      const currentOutbox = await getOutbox();
      const target = currentOutbox.find((i) => i.id === item.id);
      if (target) {
        target.retryCount += 1;
        await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(currentOutbox));
      }
    }
  }

  return { successCount, failCount };
};
