import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { NotificationItem } from '@shared/types/notifications';
import { notificationService } from '@shared/utils/notificationService';
import { AppointmentApi } from '@infrastructure/api/AppointmentApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { useAuth } from './AuthContext';
import { useAdminAccess } from './AdminAccessContext';

const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'barber_flow_notifications_enabled';
const FETCH_DAYS_BACK = 180;
const FETCH_DAYS_FORWARD = 7;

interface NotificationInboxContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  notificationsEnabled: boolean;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  setNotificationsEnabled: (value: boolean) => void;
}

const NotificationInboxContext = createContext<NotificationInboxContextType | undefined>(undefined);

export const NotificationInboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { isSafeModeEnabled } = useAdminAccess();
  const operationalScreensLocked = user?.role === 'Admin' && isSafeModeEnabled;

  const appointmentApi = useMemo(() => new AppointmentApi(new AxiosHttpClient()), []);

  const [storedNotifications, setStoredNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || operationalScreensLocked) {
      setStoredNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const today = new Date();
      const startDate = format(subDays(today, FETCH_DAYS_BACK), 'yyyy-MM-dd');
      const endDate = format(addDays(today, FETCH_DAYS_FORWARD), 'yyyy-MM-dd');
      const appointments = await appointmentApi.getByDateRange(startDate, endDate);
      const collection = notificationService.refreshNotifications(appointments);
      setStoredNotifications(collection.items);
    } finally {
      setIsLoading(false);
    }
  }, [appointmentApi, isAuthenticated, operationalScreensLocked]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const setNotificationsEnabled = (value: boolean) => {
    setNotificationsEnabledState(value);
    localStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, String(value));
  };

  const notifications = useMemo(
    () => (notificationsEnabled ? storedNotifications.filter((item) => !item.dismissedAt) : []),
    [notificationsEnabled, storedNotifications]
  );

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  const markAsRead = (notificationId: string) => {
    const collection = notificationService.markAsRead(notificationId);
    setStoredNotifications(collection.items);
  };

  const markAllAsRead = () => {
    const collection = notificationService.markAllAsRead(storedNotifications);
    setStoredNotifications(collection.items);
  };

  const dismissNotification = (notificationId: string) => {
    const collection = notificationService.dismissNotification(notificationId);
    setStoredNotifications(collection.items);
  };

  return (
    <NotificationInboxContext.Provider
      value={{
        notifications,
        unreadCount,
        notificationsEnabled,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        setNotificationsEnabled,
      }}
    >
      {children}
    </NotificationInboxContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotificationInbox = () => {
  const context = useContext(NotificationInboxContext);
  if (!context) {
    throw new Error('useNotificationInbox must be used within NotificationInboxProvider');
  }
  return context;
};
