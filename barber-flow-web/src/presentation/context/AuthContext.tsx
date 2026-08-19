import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AuthenticatedUser } from '@domain/entities';
import { LoginUseCase, LogoutUseCase, GetStoredUserUseCase } from '@application/use-cases/auth';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { UsersApi } from '@infrastructure/api/UsersApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';

// Backstop de propagación para sesiones que quedan completamente inactivas (sin ninguna
// request) durante mucho tiempo — el enforcement real e inmediato pasa por el 403
// ACCOUNT_BLOCKED que AxiosHttpClient intercepta en cualquier llamada a la API.
const BLOCKED_STATUS_POLL_INTERVAL_MS = 24 * 60 * 60 * 1000;

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

  const authApi = useMemo(() => new AuthApi(new AxiosHttpClient()), []);
  const usersApi = useMemo(() => new UsersApi(new AxiosHttpClient()), []);

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
  }, [authApi]);

  // Backstop de propagación para una sesión ya logueada que queda inactiva: revisa el
  // estado de bloqueo una vez al día. El manejo del 403 ACCOUNT_BLOCKED en
  // AxiosHttpClient ya cubre el caso de cualquier request activo, esto es solo para
  // sesiones abiertas que no llaman a la API durante mucho tiempo.
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        const status = await usersApi.getStatus();
        if (status.isBlocked) {
          setUser((prev) => (prev ? { ...prev, isBlocked: true } : prev));
        }
      } catch {
        // Si la llamada falla (p. ej. por estar bloqueado), el interceptor de
        // AxiosHttpClient ya se encarga de redirigir a /blocked.
      }
    }, BLOCKED_STATUS_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, usersApi]);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
