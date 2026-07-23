import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser } from '@domain/entities';
import { LoginUseCase, LogoutUseCase, GetStoredUserUseCase } from '@application/use-cases/auth';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthenticatedUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const httpClient = new AxiosHttpClient();
  const authApi = new AuthApi(httpClient);

  // Recuperar usuario guardado al montar el componente
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const getStoredUserUC = new GetStoredUserUseCase(authApi);
        const storedUser = await getStoredUserUC.execute();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userName: string, password: string) => {
    const loginUC = new LoginUseCase(authApi);
    const authenticatedUser = await loginUC.execute({ userName, password });
    setUser(authenticatedUser);
  };

  const logout = async () => {
    const logoutUC = new LogoutUseCase(authApi);
    await logoutUC.execute();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
