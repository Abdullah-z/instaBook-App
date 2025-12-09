import React, { createContext, useEffect, useState, useContext } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  notification: any;
  showNotification: boolean;
  setNotification: (notif: any) => void;
  setShowNotification: (show: boolean) => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  notification: null,
  showNotification: false,
  setNotification: () => {},
  setShowNotification: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useContext(AuthContext);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

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
      });

      newSocket.on('createNotifyToClient', (msg: any) => {
        console.log('🔔 Received notification:', msg);
        setNotification(msg);
        setShowNotification(true);
        // Play sound here if needed
      });

      newSocket.on('removeNotifyToClient', (msg: any) => {
        console.log('🔕 Removed notification:', msg);
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
        notification,
        showNotification,
        setNotification,
        setShowNotification,
      }}>
      {children}
    </SocketContext.Provider>
  );
};
