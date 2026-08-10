import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface NotificationsHeroCardProps {
  visibleCount: number;
  unreadCount: number;
  isLoading: boolean;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
}

export const NotificationsHeroCard: React.FC<NotificationsHeroCardProps> = ({
  visibleCount,
  unreadCount,
  isLoading,
  onRefresh,
  onMarkAllAsRead,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '24px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
        boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color: appColors.accent,
        }}
      >
        Resumen diario
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Espacio de notificaciones
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, mt: 0.5, lineHeight: '20px' }}>
        Revisa la agenda de mañana, identifica clientes que requieren seguimiento y mantén las
        notificaciones enfocadas en acciones concretas.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5 }}>
        <Box
          sx={{
            backgroundColor: appColors.surfaceElevated,
            borderRadius: '14px',
            border: `1px solid ${appColors.border}`,
            flex: 1,
            px: 1.75,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: appColors.textPrimary }}>
            {visibleCount}
          </Typography>
          <Typography sx={{ fontSize: 12, color: appColors.textSecondary, textTransform: 'uppercase' }}>
            Visibles
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: appColors.surfaceElevated,
            borderRadius: '14px',
            border: `1px solid ${appColors.border}`,
            flex: 1,
            px: 1.75,
            py: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: appColors.textPrimary }}>
            {unreadCount}
          </Typography>
          <Typography sx={{ fontSize: 12, color: appColors.textSecondary, textTransform: 'uppercase' }}>
            No leídas
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Box
          component="button"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          sx={{
            border: 'none',
            cursor: 'pointer',
            backgroundColor: appColors.accent,
            color: appColors.onAccent,
            borderRadius: '12px',
            px: 2.5,
            py: 1.25,
            fontSize: 14,
            fontWeight: 700,
            opacity: isLoading ? 0.6 : 1,
            '&:hover': { backgroundColor: appColors.accentLight },
          }}
        >
          {isLoading ? '...' : 'Actualizar'}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          sx={{
            border: `1px solid ${appColors.border}`,
            cursor: unreadCount === 0 ? 'default' : 'pointer',
            backgroundColor: 'transparent',
            color: appColors.textSecondary,
            borderRadius: '12px',
            px: 2.25,
            py: 1.25,
            fontSize: 14,
            fontWeight: 600,
            opacity: unreadCount === 0 ? 0.4 : 1,
          }}
        >
          Marcar todo como leído
        </Box>
      </Box>
    </Box>
  );
};
