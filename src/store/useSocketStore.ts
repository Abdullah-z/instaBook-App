import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { Audio as ExpoAudio, AVPlaybackStatus } from 'expo-av';
import { getNotifications } from '../api/notificationAPI';
import Toast from 'react-native-toast-message';
import * as RootNavigation from '../navigation/RootNavigation';

interface SocketState {
  socket: Socket | null;
  notifications: any[];
  unreadCount: number;
  onlineUsers: Set<string>;
  showNotification: boolean;
  notification: any;
  setNotifications: (notifs: any[]) => void;
  setNotification: (notif: any) => void;
  setShowNotification: (show: boolean) => void;
  refreshNotifications: (token: string) => Promise<void>;
  connectSocket: (user: any, token: string) => void;
  disconnectSocket: () => void;
}

const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  notifications: [],
  unreadCount: 0,
  onlineUsers: new Set(),
  showNotification: false,
  notification: null,

  setNotifications: (notifs) => set({ notifications: notifs, unreadCount: notifs.filter(n => !n.isRead).length }),
  setNotification: (notif) => set({ notification: notif }),
  setShowNotification: (show) => set({ showNotification: show }),

  refreshNotifications: async (token) => {
    if (token) {
      try {
        const res = await getNotifications();
        const notifs = res.notifies;
        set({ notifications: notifs, unreadCount: notifs.filter((n: any) => !n.isRead).length });
      } catch (err) {
        console.error(err);
      }
    }
  },

  connectSocket: (user, token) => {
    const { socket } = get();
    if (socket) return; // Already connected

    const socketUrl = 'https://instabook-server-production.up.railway.app';
    console.log('Connecting to Socket.IO server:', socketUrl);

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      newSocket.emit('joinUser', user._id);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Socket connection error:', error.message);
    });

    newSocket.on('disconnect', (reason: any) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    newSocket.on('addMessageToClient', (msg: any) => {
      console.log('📨 Received message via socket:', msg);
      const isGroup = !!msg.conversation;
      const isForMe = msg.recipient === user._id || isGroup;
      const isFromMe = msg.sender?._id === user._id;

      if (isForMe && !isFromMe) {
        try {
          const senderName = msg?.sender?.username || 'User';
          const groupName = msg?.groupName || 'Group Chat';

          Toast.show({
            type: 'success',
            text1: isGroup ? `New message in ${groupName}` : `New message from ${senderName}`,
            text2: msg?.text || (msg?.media && msg?.media.length > 0 ? 'Sent an image' : 'Sent a message'),
            onPress: () => {
              if (isGroup) {
                RootNavigation.navigate('Chat' as never, { userId: msg.conversation, username: groupName, isGroup: true } as never);
              } else if (msg?.sender?._id) {
                RootNavigation.navigate('Chat' as never, { userId: msg.sender._id, username: senderName, avatar: msg.sender.avatar || null } as never);
              }
              Toast.hide();
            },
          });
        } catch (err) {
          console.error('❌ Failed to show Toast:', err);
        }
      }
    });

    newSocket.on('createNotifyToClient', async (msg: any) => {
      console.log('🔔 Received notification:', msg);
      set(state => {
        const notifs = [msg, ...state.notifications];
        return { 
          notifications: notifs, 
          notification: msg, 
          showNotification: true,
          unreadCount: notifs.filter((n: any) => !n.isRead).length
        };
      });

      try {
        const soundModule = require('../constants/sounds/notification.mp3');
        if (soundModule) {
          const { sound } = await ExpoAudio.Sound.createAsync(soundModule);
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) {
              await sound.unloadAsync();
            }
          });
        }
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    });

    newSocket.on('removeNotifyToClient', (msg: any) => {
      console.log('🔕 Removed notification:', msg);
      set(state => {
        const notifs = state.notifications.filter((n: any) => n.id !== msg.id || n.url !== msg.url);
        return { 
          notifications: notifs,
          unreadCount: notifs.filter((n: any) => !n.isRead).length
        };
      });
    });

    newSocket.on('userOnlineStatusChanged', (data: any) => {
      set(state => {
        const newSet = new Set(state.onlineUsers);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return { onlineUsers: newSet };
      });
    });

    newSocket.on('onlineUsersList', (userIds: string[]) => {
      set({ onlineUsers: new Set(userIds) });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log('🔴 Closing socket connection');
      socket.close();
      set({ socket: null });
    }
  }
}));

export default useSocketStore;
