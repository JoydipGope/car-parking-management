import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification } from '../App';
import { mockApi, mockSocket } from './services/mockApi';

type NotificationContextType = {
  notifications: AppNotification[];
  socket: typeof mockSocket | null;
  isConnected: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  addNotification: (notification: AppNotification) => void;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

type NotificationProviderProps = {
  userId: string;
  children: React.ReactNode;
};

export function NotificationProvider({ userId, children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to mock socket
    const handleConnect = () => {
      setIsConnected(true);
      console.log('Connected to mock Socket.IO server');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from mock Socket.IO server');
    };

    const handleNotification = (data: { userId: string; message: string; created_at: string }) => {
      const numericUserId = parseInt(userId.replace('user-', '').replace('admin-', '')) || (userId.includes('admin') ? 1 : 2);
      if (data.userId === numericUserId || data.userId === parseInt(userId)) {
        const newNotification: AppNotification = {
          id: `temp-${Date.now()}`,
          user_id: userId,
          message: data.message,
          is_read: false,
          created_at: data.created_at
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    };

    mockSocket.on('connect', handleConnect);
    mockSocket.on('disconnect', handleDisconnect);
    mockSocket.on('notification', handleNotification);

    // Set initial connection status
    setIsConnected(mockSocket.isConnected);

    return () => {
      mockSocket.off('connect', handleConnect);
      mockSocket.off('disconnect', handleDisconnect);
      mockSocket.off('notification', handleNotification);
    };
  }, [userId]);

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const numericUserId = parseInt(userId.replace('user-', '').replace('admin-', '')) || (userId.includes('admin') ? 1 : 2);
        const data = await mockApi.getNotifications(numericUserId);
        const formattedNotifications: AppNotification[] = data.map(n => ({
          id: n.id.toString(),
          user_id: userId,
          message: n.message,
          is_read: n.is_read,
          created_at: n.created_at
        }));
        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (notificationId.startsWith('temp-')) {
        // Handle temporary notifications (real-time ones)
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        return;
      }

      await mockApi.markNotificationRead(parseInt(notificationId));
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const addNotification = (notification: AppNotification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const value: NotificationContextType = {
    notifications,
    socket: mockSocket,
    isConnected,
    markAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}