// src/api/nearbyAPI.ts
// Service layer for the NearbyChat module - handles peer management and message routing

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NearbyChatModule,
  addPeerFoundListener,
  addPeerLostListener,
  addConnectedListener,
  addDisconnectedListener,
  addMessageReceivedListener,
  addImageReceivedListener,
  addImageProgressListener,
} from '../../modules/nearby-chat/src';

export interface NearbyPeer {
  endpointId: string;
  name: string;
  avatar?: string;
  status: 'discovered' | 'connecting' | 'connected' | 'disconnected';
}

export interface NearbyMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isOwn: boolean;
  type: 'text' | 'image';
  imageUri?: string;
  /** 'room' for broadcasts, endpointId for DM messages */
  targetId: string;
}

export type NearbyEventType =
  | 'peer_found'
  | 'peer_lost'
  | 'connected'
  | 'disconnected'
  | 'message_received'
  | 'image_progress';

type NearbyListener = (data: any) => void;

// ─── Singleton NearbyService ──────────────────────────────────────────────────
class NearbyService {
  private peers: Map<string, NearbyPeer> = new Map();
  private messages: NearbyMessage[] = [];
  private subscriptions: any[] = [];
  private eventListeners: Map<NearbyEventType, Set<NearbyListener>> = new Map();
  private myName: string = 'Unknown';
  private isRunning: boolean = false;

  // ─── Public API ──────────────────────────────────────────────────────────

  private lastError: string | null = null;

  getLastError(): string | null { return this.lastError; }

  async start(username: string) {
    if (this.isRunning) {
      console.log('[NearbyService] Already running');
      return;
    }
    const parts = username.split('|');
    this.myName = parts[0];
    this.peers.clear();
    this.lastError = null;
    this._registerNativeListeners();
    try {
      await NearbyChatModule.startAdvertising(username);
    } catch (e: any) {
      const msg = e?.message || String(e);
      this.lastError = 'Advertising error: ' + msg;
      console.error('[NearbyService] startAdvertising failed:', msg);
      throw new Error(this.lastError);
    }
    try {
      await NearbyChatModule.startDiscovery(username);
    } catch (e: any) {
      const msg = e?.message || String(e);
      this.lastError = 'Discovery error: ' + msg;
      console.error('[NearbyService] startDiscovery failed:', msg);
      // Stop advertising since discovery failed
      try { await NearbyChatModule.stopAll(); } catch (_) {}
      throw new Error(this.lastError);
    }
    this.isRunning = true;
    console.log('[NearbyService] ✅ Started for:', username);
  }

  async stop() {
    try {
      await NearbyChatModule.stopAll();
    } catch (e) {
      console.error('[NearbyService] Stop error:', e);
    }
    this.subscriptions.forEach((s) => s?.remove?.());
    this.subscriptions = [];
    this.peers.clear();
    this.isRunning = false;
    console.log('[NearbyService] Stopped');
  }

  async connectToPeer(endpointId: string) {
    const peer = this.peers.get(endpointId);
    if (!peer) return;
    this._updatePeer(endpointId, { status: 'connecting' });
    try {
      await NearbyChatModule.connectToEndpoint(endpointId, this.myName);
    } catch (e) {
      console.error('[NearbyService] Connect error:', e);
      this._updatePeer(endpointId, { status: 'discovered' });
    }
  }

  async sendMessage(endpointId: string, message: string) {
    const ownMsg: NearbyMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: 'me',
      senderName: this.myName,
      message,
      timestamp: Date.now(),
      isOwn: true,
      type: 'text',
      targetId: endpointId,
    };
    this.messages.push(ownMsg);
    this._emit('message_received', ownMsg);
    await this._saveMessages();

    try {
      await NearbyChatModule.sendMessage(endpointId, "/dm/" + message, this.myName);
    } catch (e) {
      console.error('[NearbyService] Send error:', e);
    }
  }

  async sendImage(endpointId: string, imageUri: string) {
    // imageUri is a file:// path already copied to cacheDir by the caller
    const filePath = imageUri.startsWith('file://') ? imageUri.slice(7) : imageUri;
    const ownMsg: NearbyMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: 'me',
      senderName: this.myName,
      message: '\ud83d\udcf7 Photo',
      timestamp: Date.now(),
      isOwn: true,
      type: 'image',
      imageUri,
      targetId: endpointId,
    };
    this.messages.push(ownMsg);
    this._emit('message_received', ownMsg);
    await this._saveMessages();
    try {
      await NearbyChatModule.sendImageFile(endpointId, filePath, this.myName);
    } catch (e) {
      console.error('[NearbyService] Send image error:', e);
      throw e;
    }
  }

  async broadcastImage(imageUri: string) {
    const filePath = imageUri.startsWith('file://') ? imageUri.slice(7) : imageUri;
    const ownMsg: NearbyMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: 'me',
      senderName: this.myName,
      message: '\ud83d\udcf7 Photo',
      timestamp: Date.now(),
      isOwn: true,
      type: 'image',
      imageUri,
      targetId: 'room',
    };
    this.messages.push(ownMsg);
    this._emit('message_received', ownMsg);
    await this._saveMessages();
    try {
      await NearbyChatModule.broadcastImageFile(filePath, this.myName);
    } catch (e) {
      console.error('[NearbyService] Broadcast image error:', e);
      throw e;
    }
  }

  async sendBroadcast(message: string) {
    const ownMsg: NearbyMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: 'me',
      senderName: this.myName,
      message,
      timestamp: Date.now(),
      isOwn: true,
      type: 'text',
      targetId: 'room',
    };
    this.messages.push(ownMsg);
    this._emit('message_received', ownMsg);
    await this._saveMessages();

    try {
      await NearbyChatModule.sendBroadcast("/room/" + message, this.myName);
    } catch (e) {
      console.error('[NearbyService] Broadcast error:', e);
    }
  }

  getPeers(): NearbyPeer[] {
    return Array.from(this.peers.values());
  }

  getMessages(): NearbyMessage[] {
    return [...this.messages];
  }

  getPeerMessages(endpointId: string): NearbyMessage[] {
    return this.messages.filter(
      (m) => m.senderId === endpointId || (m.senderId === 'me' && m.isOwn)
    );
  }

  isActive(): boolean {
    return this.isRunning;
  }

  on(event: NearbyEventType, listener: NearbyListener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
    return () => this.eventListeners.get(event)?.delete(listener);
  }

  // ─── Load persisted messages ──────────────────────────────────────────────

  async loadMessages() {
    try {
      const raw = await AsyncStorage.getItem('nearby_messages');
      if (raw) {
        this.messages = JSON.parse(raw);
      }
    } catch (e) {
      console.log('[NearbyService] Could not load messages:', e);
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private _registerNativeListeners() {
    this.subscriptions.push(
      addPeerFoundListener((e) => {
        console.log('[NearbyService] Peer found:', e.endpointId, e.name);
        this._updatePeer(e.endpointId, { name: e.name, status: 'discovered' });
        this._emit('peer_found', this.peers.get(e.endpointId));
      })
    );
    this.subscriptions.push(
      addPeerLostListener((e) => {
        console.log('[NearbyService] Peer lost:', e.endpointId);
        this.peers.delete(e.endpointId);
        this._emit('peer_lost', { endpointId: e.endpointId });
      })
    );
    this.subscriptions.push(
      addConnectedListener((e) => {
        console.log('[NearbyService] Connected to:', e.endpointId, e.name);
        this._updatePeer(e.endpointId, { name: e.name, status: 'connected' });
        this._emit('connected', this.peers.get(e.endpointId));
      })
    );
    this.subscriptions.push(
      addDisconnectedListener((e) => {
        console.log('[NearbyService] Disconnected from:', e.endpointId);
        this._updatePeer(e.endpointId, { status: 'disconnected' });
        this._emit('disconnected', { endpointId: e.endpointId });
      })
    );
    // Connection failed event
    this.subscriptions.push(
      NearbyChatModule.addListener('onConnectionFailed', (e: any) => {
        console.warn('[NearbyService] Connection failed to:', e.endpointId, 'code:', e.statusCode);
        this._updatePeer(e.endpointId, { status: 'discovered' });
        this._emit('peer_found', this.peers.get(e.endpointId));
      })
    );
    this.subscriptions.push(
      addImageReceivedListener((e) => {
        console.log('[NearbyService] Image received from:', e.senderName);
        let targetId = e.endpointId;
        if (e.fileName && e.fileName.startsWith('/room/')) {
          targetId = 'room';
        }
        const msg: NearbyMessage = {
          id: `${e.timestamp}-${Math.random()}`,
          senderId: e.endpointId,
          senderName: e.senderName,
          message: '📷 Photo',
          timestamp: e.timestamp,
          isOwn: false,
          type: 'image',
          imageUri: `file://${e.filePath}`,
          targetId: targetId,
        };
        this.messages.push(msg);
        this._emit('message_received', msg);
        this._saveMessages();
      })
    );
    this.subscriptions.push(
      addImageProgressListener((e) => {
        this._emit('image_progress', {
          payloadId: e.payloadId,
          bytesTransferred: e.bytesTransferred,
          totalBytes: e.totalBytes,
        });
      })
    );
    this.subscriptions.push(
      addMessageReceivedListener((e) => {
        let cleanMsg = e.message;
        let targetId = e.endpointId;

        if (e.message.startsWith('/room/')) {
          cleanMsg = e.message.substring(6);
          targetId = 'room';
        } else if (e.message.startsWith('/dm/')) {
          cleanMsg = e.message.substring(4);
          targetId = e.endpointId;
        }

        const msg: NearbyMessage = {
          id: `${e.timestamp}-${Math.random()}`,
          senderId: e.endpointId,
          senderName: e.senderName,
          message: cleanMsg,
          timestamp: e.timestamp,
          isOwn: false,
          type: 'text',
          targetId: targetId,
        };
        this.messages.push(msg);
        this._emit('message_received', msg);
        this._saveMessages();
      })
    );
  }

  private _updatePeer(endpointId: string, patch: Partial<NearbyPeer>) {
    const existing = this.peers.get(endpointId) || {
      endpointId,
      name: 'Unknown',
      status: 'discovered' as const,
    };
    
    if (patch.name && patch.name.includes('|')) {
      const parts = patch.name.split('|');
      patch.name = parts[0];
      patch.avatar = parts[1] || undefined;
    }

    this.peers.set(endpointId, { ...existing, ...patch });
  }

  private _emit(event: NearbyEventType, data: any) {
    this.eventListeners.get(event)?.forEach((cb) => cb(data));
  }

  private async _saveMessages() {
    try {
      // Keep only the last 200 messages to avoid storage bloat
      const trimmed = this.messages.slice(-200);
      await AsyncStorage.setItem('nearby_messages', JSON.stringify(trimmed));
    } catch (e) {
      console.log('[NearbyService] Save messages error:', e);
    }
  }
}

export default new NearbyService();
