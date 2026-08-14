import React, { useMemo } from 'react';
import { Drawer as MuiDrawer, Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  DateRange,
  People,
  BarChart,
  NotificationsOutlined,
  Settings,
  Home,
  Logout,
  HelpOutline,
  DeleteOutline,
  SvgIconComponent,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@presentation/context/AuthContext';
import { useAdminAccess } from '@presentation/context/AdminAccessContext';
import { useNotificationInbox } from '@presentation/context/NotificationInboxContext';
import { useConfirmDialog } from '@presentation/context/ConfirmDialogContext';
import { useNotification } from '@presentation/context/NotificationContext';
import { AuthApi } from '@infrastructure/api/AuthApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';
import { appColors } from '@presentation/theme/appColors';
import { scrollbarSx } from '@presentation/theme/scrollbarSx';

interface SidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

const OPERATIONAL_PATHS = new Set(['/appointments', '/clients', '/reports', '/notifications']);

export const DRAWER_WIDTH = 280;

const menuItems: { label: string; path: string; icon: SvgIconComponent }[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Citas', path: '/appointments', icon: DateRange },
  { label: 'Clientes', path: '/clients', icon: People },
  { label: 'Reportes', path: '/reports', icon: BarChart },
  { label: 'Notificaciones', path: '/notifications', icon: NotificationsOutlined },
  { label: 'Configuración', path: '/settings', icon: Settings },
];

const getInitials = (name?: string) => {
  const parts = name?.trim()?.split(/\s+/) ?? [];
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase() || 'U';
};

const ActionRow: React.FC<{
  icon: SvgIconComponent;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, destructive, onClick }) => (
  <Box
    component="button"
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      border: 'none',
      cursor: 'pointer',
      backgroundColor: 'transparent',
      borderRadius: '14px',
      px: 1.5,
      py: 1.25,
      textAlign: 'left',
      '&:hover': { backgroundColor: destructive ? appColors.errorBg : appColors.surfaceElevated },
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: destructive ? `${appColors.error}38` : `${appColors.accent}29`,
      }}
    >
      <Icon sx={{ color: destructive ? appColors.error : appColors.accent, fontSize: 19 }} />
    </Box>
    <Typography sx={{ fontSize: 15, fontWeight: 700, color: destructive ? appColors.error : appColors.textPrimary }}>
      {label}
    </Typography>
  </Box>
);

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isSafeModeEnabled } = useAdminAccess();
  const { unreadCount } = useNotificationInbox();
  const { confirm } = useConfirmDialog();
  const { showNotification } = useNotification();

  const authApi = useMemo(() => new AuthApi(new AxiosHttpClient()), []);

  const areOperationalScreensLocked = user?.role === 'Admin' && isSafeModeEnabled;
  const visibleMenuItems = areOperationalScreensLocked
    ? menuItems.filter((item) => !OPERATIONAL_PATHS.has(item.path))
    : menuItems;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const handleHelp = () => {
    confirm({
      title: 'Ayuda',
      message: 'Para obtener ayuda, contacta con soporte o revisa la documentación.',
      confirmText: 'Entendido',
      hideCancel: true,
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: 'Eliminar cuenta',
      message: 'Esta acción es permanente e irreversible. Se eliminarán todos tus datos.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await authApi.deleteSelf();
      await logout();
      onClose();
      navigate('/login');
    } catch (error) {
      showNotification(getErrorMessage(error, 'No se pudo eliminar la cuenta'), 'error');
    }
  };

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      <MuiDrawer
        anchor="left"
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { backgroundColor: appColors.background, width: DRAWER_WIDTH, ...scrollbarSx } }}
      >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            backgroundColor: appColors.surface,
            borderRadius: '20px',
            border: `1px solid ${appColors.border}`,
            p: 2,
            boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: appColors.accent,
            }}
          >
            Barber Flow
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                flexShrink: 0,
                borderRadius: '50%',
                border: `2px solid ${appColors.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: appColors.background,
              }}
            >
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: appColors.accent }}>
                {getInitials(user?.name)}
              </Typography>
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary }}>
                {user?.name ?? 'Usuario'}
              </Typography>
              <Typography noWrap sx={{ fontSize: 12, color: appColors.textSecondary }}>
                {user?.userName ?? user?.email}
              </Typography>
            </Box>
          </Box>

          {user?.role && (
            <Box
              sx={{
                display: 'inline-flex',
                mt: 1.5,
                borderRadius: '999px',
                backgroundColor: appColors.surfaceElevated,
                border: `1px solid ${appColors.border}`,
                px: 1.25,
                py: 0.4,
              }}
            >
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: appColors.textSecondary }}>
                {user.role}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 2 }}>
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Box
                key={item.path}
                component="button"
                onClick={() => handleNavigate(item.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: `1px solid ${isActive ? appColors.accent : 'transparent'}`,
                  cursor: 'pointer',
                  backgroundColor: isActive ? appColors.surfaceElevated : 'transparent',
                  borderRadius: '14px',
                  px: 1.5,
                  py: 1.25,
                  textAlign: 'left',
                  '&:hover': { backgroundColor: appColors.surfaceElevated },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${appColors.accent}29`,
                  }}
                >
                  <item.icon sx={{ color: appColors.accent, fontSize: 19 }} />
                </Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: appColors.textPrimary, flex: 1 }}>
                  {item.label}
                </Typography>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      px: 0.5,
                      borderRadius: '10px',
                      backgroundColor: appColors.error,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: appColors.textPrimary }}>
                      {unreadCount}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Box sx={{ borderTop: `1px solid ${appColors.border}`, opacity: 0.6, mb: 1 }} />

        <ActionRow icon={HelpOutline} label="Ayuda" onClick={handleHelp} />
        {user?.role !== 'Admin' && (
          <ActionRow icon={DeleteOutline} label="Eliminar mi cuenta" destructive onClick={handleDeleteAccount} />
        )}

        <Box sx={{ borderTop: `1px solid ${appColors.border}`, opacity: 0.6, my: 1 }} />

        <ActionRow icon={Logout} label="Cerrar sesión" destructive onClick={handleLogout} />
      </Box>
      </MuiDrawer>
    </Box>
  );
};
