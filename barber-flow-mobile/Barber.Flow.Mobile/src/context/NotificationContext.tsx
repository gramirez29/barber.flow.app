import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAppointmentStore } from "../features/appointments/appointment.store";
import { notificationService } from "../services/notificationService";
import { settingsService } from "../services/settingsService";
import type { NotificationItem } from "../types/notifications";

interface NotificationContextProps {
  dismissNotification: (notificationId: string) => Promise<void>;
  isLoading: boolean;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  notifications: NotificationItem[];
  notificationsEnabled: boolean;
  refreshNotifications: () => Promise<void>;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextProps | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const appointments = useAppointmentStore((state) => state.appointments);
    const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
    const [storedNotifications, setStoredNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadSettings = async () => {
            const preferences = await settingsService.getStoredPreferences();

            if (!mounted || preferences?.notificationsEnabled === undefined) {
                return;
            }

            setNotificationsEnabledState(preferences.notificationsEnabled);
        };

        void loadSettings();

        return () => {
            mounted = false;
        };
    }, []);

    const refreshNotifications = useCallback(async () => {
        setIsLoading(true);

        try {
            const collection = await notificationService.refreshNotifications(appointments);
            setStoredNotifications(collection.items);
        } finally {
            setIsLoading(false);
        }
    }, [appointments]);

    useEffect(() => {
        void refreshNotifications();
    }, [refreshNotifications]);

    const setNotificationsEnabled = async (value: boolean) => {
        setNotificationsEnabledState(value);
        await settingsService.setNotificationsEnabled(value);
    };

    const notifications = useMemo(
        () => (notificationsEnabled ? storedNotifications.filter((item) => !item.dismissedAt) : []),
        [notificationsEnabled, storedNotifications],
    );

    const unreadCount = useMemo(
        () => notifications.filter((item) => !item.isRead).length,
        [notifications],
    );

    const markAsRead = async (notificationId: string) => {
        const collection = await notificationService.markAsRead(notificationId);
        setStoredNotifications(collection.items);
    };

    const markAllAsRead = async () => {
        const collection = await notificationService.markAllAsRead(storedNotifications);
        setStoredNotifications(collection.items);
    };

    const dismissNotification = async (notificationId: string) => {
        const collection = await notificationService.dismissNotification(notificationId);
        setStoredNotifications(collection.items);
    };

    return (
        <NotificationContext.Provider
            value={{
                dismissNotification,
                isLoading,
                markAllAsRead,
                markAsRead,
                notifications,
                notificationsEnabled,
                refreshNotifications,
                setNotificationsEnabled,
                unreadCount,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}