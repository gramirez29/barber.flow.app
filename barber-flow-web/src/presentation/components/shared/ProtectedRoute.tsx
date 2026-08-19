import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { Loading } from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Loading message="Verificando autenticación..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  return <>{children}</>;
};
