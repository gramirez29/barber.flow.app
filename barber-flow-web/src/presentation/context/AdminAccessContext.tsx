import React, { createContext, useContext, useState, ReactNode } from 'react';

const SAFE_MODE_STORAGE_KEY = 'barber_flow_admin_safe_mode';

interface AdminAccessContextType {
  isSafeModeEnabled: boolean;
  setSafeModeEnabled: (value: boolean) => void;
}

const AdminAccessContext = createContext<AdminAccessContextType | undefined>(undefined);

export const AdminAccessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSafeModeEnabled, setIsSafeModeEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(SAFE_MODE_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const setSafeModeEnabled = (value: boolean) => {
    setIsSafeModeEnabled(value);
    localStorage.setItem(SAFE_MODE_STORAGE_KEY, String(value));
  };

  return (
    <AdminAccessContext.Provider value={{ isSafeModeEnabled, setSafeModeEnabled }}>
      {children}
    </AdminAccessContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminAccess = () => {
  const context = useContext(AdminAccessContext);
  if (!context) {
    throw new Error('useAdminAccess must be used within AdminAccessProvider');
  }
  return context;
};
