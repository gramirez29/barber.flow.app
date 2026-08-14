import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  LoginPage,
  DashboardPage,
  AppointmentsPage,
  ClientsPage,
  ReportsPage,
  NotificationsPage,
  SettingsPage,
  ForgotPasswordPage,
  VerifyOtpPage,
  ResetPasswordPage,
  LandingPage,
} from '@presentation/pages';
import { ProtectedRoute, OperationalRoute, AppBar, SidebarDrawer, Footer } from '@presentation/components/shared';
import { useAuth } from '@presentation/context/AuthContext';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar onMenuClick={() => setDrawerOpen(true)} />
        <Box component="main" sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
          <Footer />
        </Box>
      </Box>
    </Box>
  );
};

const LANDING_HOSTNAME = 'haircutsflowcr.com';

export const Router: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const isLandingHost = window.location.hostname === LANDING_HOSTNAME;

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/forgot-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
      />

      <Route
        path="/verify-otp"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyOtpPage />}
      />

      <Route
        path="/reset-password"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <OperationalRoute>
              <ProtectedLayout>
                <AppointmentsPage />
              </ProtectedLayout>
            </OperationalRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <OperationalRoute>
              <ProtectedLayout>
                <ClientsPage />
              </ProtectedLayout>
            </OperationalRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <OperationalRoute>
              <ProtectedLayout>
                <ReportsPage />
              </ProtectedLayout>
            </OperationalRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <OperationalRoute>
              <ProtectedLayout>
                <NotificationsPage />
              </ProtectedLayout>
            </OperationalRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <SettingsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Root: apex domain shows the public landing page, every other host keeps the auth redirect */}
      <Route
        path="/"
        element={
          isLandingHost ? (
            <LandingPage />
          ) : (
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};
