// modules/nearby-chat/src/index.ts
// TypeScript interface for the NearbyChat native module.
// Falls back to a no-op stub in Expo Go — real Bluetooth requires `npx expo run:android`.


export interface PeerFoundEvent {
  endpointId: string;
  name: string;
}

export interface PeerLostEvent {
  endpointId: string;
}

export interface ConnectedEvent {
  endpointId: string;
  name: string;
}

export interface DisconnectedEvent {
  endpointId: string;
}

export interface MessageReceivedEvent {
  endpointId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface ImageReceivedEvent {
  endpointId: string;
  senderName: string;
  filePath: string;
  fileName?: string;
  timestamp: number;
}

export interface ImageProgressEvent {
  payloadId: number;
  bytesTransferred: number;
  totalBytes: number;
  status: 'progress';
}

type EventCallback<T> = (event: T) => void;

interface NativeChatModule {
  startAdvertising: (name: string) => Promise<void>;
  startDiscovery: (name: string) => Promise<void>;
  stopAll: () => Promise<void>;
  connectToEndpoint: (endpointId: string, name: string) => Promise<void>;
  sendMessage: (endpointId: string, message: string, senderName: string) => Promise<void>;
  sendBroadcast: (message: string, senderName: string) => Promise<void>;
  sendImageFile: (endpointId: string, filePath: string, senderName: string) => Promise<void>;
  broadcastImageFile: (filePath: string, senderName: string) => Promise<void>;
  addListener: (event: string, callback: (data: any) => void) => { remove: () => void };
}

// ─── Simulate the module for Expo Go compatibility ───────────────────────────
// In Expo Go there is NO real Bluetooth - this stub does nothing so the UI
// shows the correct empty state. Real discovery only works in a dev build
// compiled with `npx expo run:android`.
class NearbyChatSimulator implements NativeChatModule {
  private listeners: Map<string, Set<EventCallback<any>>> = new Map();

  addListener(event: string, callback: EventCallback<any>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return {
      remove: () => {
        this.listeners.get(event)?.delete(callback);
      },
    };
  }

  async startAdvertising(name: string) {
    console.warn('[NearbyChat] ⚠️  Expo Go detected — real Bluetooth unavailable. Run `npx expo run:android` for a native dev build.');
  }

  async startDiscovery(name: string) {
    console.warn('[NearbyChat] ⚠️  Expo Go detected — peer discovery disabled. No peers will be found.');
  }

  async stopAll() {}

  async connectToEndpoint(endpointId: string, name: string) {
    console.warn('[NearbyChat] connectToEndpoint() called in Expo Go — no-op.');
  }

  async sendMessage(endpointId: string, message: string, senderName: string) {
    console.warn('[NearbyChat] sendMessage() called in Expo Go — no-op.');
  }

  async sendBroadcast(message: string, senderName: string) {
    console.warn('[NearbyChat] sendBroadcast() called in Expo Go — no-op.');
  }

  async sendImageFile(endpointId: string, filePath: string, senderName: string) {
    console.warn('[NearbyChat] sendImageFile() called in Expo Go — no-op.');
  }

  async broadcastImageFile(filePath: string, senderName: string) {
    console.warn('[NearbyChat] broadcastImageFile() called in Expo Go — no-op.');
  }
}


// ─── Try to load the real native module, fallback to simulator ───────────────
let _module: NativeChatModule;

try {
  const { requireNativeModule } = require('expo-modules-core');
  _module = requireNativeModule('NearbyChat');
  console.log('[NearbyChat] ✅ Native module loaded');
} catch (e) {
  console.log('[NearbyChat] ⚠️  Native module not found - using demo simulator for Expo Go');
  _module = new NearbyChatSimulator();
}

export const NearbyChatModule = _module;

export function addPeerFoundListener(callback: EventCallback<PeerFoundEvent>) {
  return _module.addListener('onPeerFound', callback);
}

export function addPeerLostListener(callback: EventCallback<PeerLostEvent>) {
  return _module.addListener('onPeerLost', callback);
}

export function addConnectedListener(callback: EventCallback<ConnectedEvent>) {
  return _module.addListener('onConnected', callback);
}

export function addDisconnectedListener(callback: EventCallback<DisconnectedEvent>) {
  return _module.addListener('onDisconnected', callback);
}

export function addMessageReceivedListener(callback: EventCallback<MessageReceivedEvent>) {
  return _module.addListener('onMessageReceived', callback);
}

export function addImageReceivedListener(callback: EventCallback<ImageReceivedEvent>) {
  return _module.addListener('onImageReceived', callback);
}

export function addImageProgressListener(callback: EventCallback<ImageProgressEvent>) {
  return _module.addListener('onImageProgress', callback);
}

export default _module;
