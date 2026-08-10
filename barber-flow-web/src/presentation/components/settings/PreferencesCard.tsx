import React from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { useThemeContext } from '@presentation/context/ThemeContext';
import { useNotificationInbox } from '@presentation/context/NotificationInboxContext';

const switchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: appColors.accent },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: appColors.accent },
};

const Pill: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({
  label,
  active,
  onClick,
  disabled,
}) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    disabled={disabled}
    sx={{
      cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${active ? appColors.accent : appColors.border}`,
      backgroundColor: active ? appColors.accent : appColors.surfaceElevated,
      borderRadius: '10px',
      flex: 1,
      py: 1,
      opacity: disabled ? 0.55 : 1,
      fontSize: 13,
      fontWeight: active ? 700 : 600,
      color: active ? appColors.onAccent : appColors.textSecondary,
    }}
  >
    {label}
  </Box>
);

export const PreferencesCard: React.FC = () => {
  const { mode, setMode, isDark } = useThemeContext();
  const { notificationsEnabled, setNotificationsEnabled } = useNotificationInbox();

  const isFollowingSystem = mode === 'system';

  const handleFollowSystemToggle = () => {
    if (isFollowingSystem) {
      setMode(isDark ? 'dark' : 'light');
    } else {
      setMode('system');
    }
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: appColors.accent,
          mb: 2,
        }}
      >
        Preferencias
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          pb: 1.75,
          borderBottom: `1px solid ${appColors.border}`,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>
            Usar tema del dispositivo
          </Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5 }}>
            {isFollowingSystem
              ? `La aplicación sigue el tema del dispositivo. Tema actual: ${isDark ? 'Oscuro' : 'Claro'}.`
              : 'Elige el tema que deseas mantener en la aplicación.'}
          </Typography>
        </Box>
        <Switch checked={isFollowingSystem} onChange={handleFollowSystemToggle} sx={switchSx} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, mb: 2, opacity: isFollowingSystem ? 0.55 : 1 }}>
        <Pill label="Claro" active={mode === 'light'} disabled={isFollowingSystem} onClick={() => setMode('light')} />
        <Pill label="Oscuro" active={mode === 'dark'} disabled={isFollowingSystem} onClick={() => setMode('dark')} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pt: 0.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>
            Notificaciones
          </Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5 }}>
            Activa o desactiva el resumen de agenda de mañana y los recordatorios de seguimiento
            en la bandeja de Notificaciones.
          </Typography>
        </Box>
        <Switch checked={notificationsEnabled} onChange={handleNotificationsToggle} sx={switchSx} />
      </Box>
    </Box>
  );
};
