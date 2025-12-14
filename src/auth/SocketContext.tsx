import React, { createContext, useEffect, useState, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { getNotifications } from '../api/notificationAPI';
import Toast from 'react-native-toast-message';
import * as RootNavigation from '../navigation/RootNavigation';

interface SocketContextType {
  socket: Socket | null;
  notifications: any[];
  unreadCount: number;
  onlineUsers: Set<string>;
  setNotifications: (notif: any[]) => void;
  showNotification: boolean;
  setNotification: (notif: any) => void;
  setShowNotification: (show: boolean) => void;
  refreshNotifications: () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  notifications: [],
  unreadCount: 0,
  onlineUsers: new Set(),
  setNotifications: () => {},
  showNotification: false,
  setNotification: () => {},
  setShowNotification: () => {},
  refreshNotifications: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notification, setNotification] = useState<any>(null); // For popup
  const [showNotification, setShowNotification] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const refreshNotifications = async () => {
    if (token) {
      try {
        const res = await getNotifications();
        setNotifications(res.notifies);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    refreshNotifications();
  }, [token]);

  useEffect(() => {
    if (token && user) {
      // Using your computer's IP address for physical device
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
        console.log('📡 Joined user room:', user._id);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error.message);
      });

      newSocket.on('disconnect', (reason: any) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      newSocket.on('addMessageToClient', (msg: any) => {
        console.log('📨 Received message via socket:', msg);

        // Show Toast notification if message is from someone else
        if (msg.recipient === user._id) {
          Toast.show({
            type: 'success',
            text1: `New message from ${msg.sender.username}`,
            text2:
              msg.text || (msg.media && msg.media.length > 0 ? 'Sent an image' : 'Sent a message'),
            onPress: () => {
              RootNavigation.navigate(
                'Chat' as never,
                {
                  userId: msg.sender._id,
                  username: msg.sender.username,
                } as never
              );
              Toast.hide();
            },
          });
        }
      });

      newSocket.on('createNotifyToClient', (msg: any) => {
        console.log('🔔 Received notification:', msg);
        setNotifications((prev) => [msg, ...prev]);
        setNotification(msg);
        setShowNotification(true);
        // Play sound here if needed
      });

      newSocket.on('removeNotifyToClient', (msg: any) => {
        console.log('🔕 Removed notification:', msg);
        setNotifications((prev) => prev.filter((n) => n.id !== msg.id || n.url !== msg.url));
      });

      newSocket.on('userOnlineStatusChanged', (data: any) => {
        console.log('👤 User online status changed:', data);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isOnline) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      });

      newSocket.on('onlineUsersList', (userIds: string[]) => {
        console.log('👥 Received online users list:', userIds);
        setOnlineUsers(new Set(userIds));
      });

      setSocket(newSocket);

      return () => {
        console.log('🔴 Closing socket connection');
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        onlineUsers,
        setNotifications,
        notification,
        showNotification,
        setNotification,
        setShowNotification,
        refreshNotifications,
      }}>
      {children}
    </SocketContext.Provider>
  );
};
