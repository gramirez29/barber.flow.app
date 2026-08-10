import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

export const NotificationsDisabledCard: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '24px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
      }}
    >
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, mb: 1 }}>
        Las notificaciones están desactivadas
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, lineHeight: '20px' }}>
        Activa las notificaciones en Ajustes para restaurar el resumen y el contador de no leídas.
      </Typography>
    </Box>
  );
};
