import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { useAdminAccess } from '@presentation/context/AdminAccessContext';

interface OperationalRouteProps {
  children: React.ReactNode;
}

/**
 * Bloquea Citas/Clientes/Reportes cuando la cuenta es Admin y el modo seguro
 * está activo, evitando que la cuenta admin compartida toque datos reales por
 * accidente (mismo criterio que mobile, que directamente no monta esos tabs).
 */
export const OperationalRoute: React.FC<OperationalRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const { isSafeModeEnabled } = useAdminAccess();

  if (user?.role === 'Admin' && isSafeModeEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
