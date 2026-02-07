import React, { createContext, useContext, useState } from "react";

interface NotificationContextProps {
    clientNotifications: number;
    setClientNotifications: React.Dispatch<React.SetStateAction<number>>;
};

const NotificationContext = createContext<NotificationContextProps | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const [clientNotifications, setClientNotifications] = useState(2);
    return (
        <NotificationContext.Provider value={{ clientNotifications, setClientNotifications }}>
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