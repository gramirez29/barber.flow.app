import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

export const SettingsHeroCard: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
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
        Ajustes del espacio
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        Ajustes y preferencias
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, mt: 0.5 }}>
        Configura las preferencias de la aplicación, administra usuarios de aplicación solo para
        administradores y mantén la experiencia alineada con tu flujo de trabajo.
      </Typography>
    </Box>
  );
};
