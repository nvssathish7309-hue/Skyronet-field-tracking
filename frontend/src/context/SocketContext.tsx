import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitLocation: (data: {
    engineerId: string;
    taskId?: string;
    tripId?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
  }) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? 'https://skyronet-field-tracking-backend.onrender.com' : 'http://localhost:5000');
    const s = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join:room', user.role);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isAuthenticated, user]);

  const emitLocation = (data: {
    engineerId: string;
    taskId?: string;
    tripId?: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed?: number;
    heading?: number;
  }) => {
    if (socket && isConnected) {
      socket.emit('engineer:send-location', data);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, emitLocation }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
