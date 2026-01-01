import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: Date;
  // For navigation - which page and item to navigate to
  linkTo?: string; // e.g., '/products', '/sales'
  linkItemId?: string; // The ID of the item to highlight/scroll to
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'Stock faible',
    message: 'Le produit "Café Arabica 1kg" a atteint le seuil minimum de stock.',
    type: 'warning',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    linkTo: '/products',
    linkItemId: '1',
  },
  {
    id: '2',
    title: 'Rupture de stock',
    message: 'Le produit "Huile d\'olive 1L" est en rupture de stock.',
    type: 'error',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    linkTo: '/products',
    linkItemId: '2',
  },
  {
    id: '3',
    title: 'Nouvelle vente',
    message: 'Une vente de 2 iPhone 15 Pro a été enregistrée.',
    type: 'success',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    linkTo: '/sales',
    linkItemId: '1',
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem('app_notifications');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: Notification) => ({ ...n, createdAt: new Date(n.createdAt) }));
    }
    return defaultNotifications;
  });

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
