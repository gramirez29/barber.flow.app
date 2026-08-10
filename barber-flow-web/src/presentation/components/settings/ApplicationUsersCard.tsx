import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface ApplicationUsersCardProps {
  onOpen: () => void;
}

export const ApplicationUsersCard: React.FC<ApplicationUsersCardProps> = ({ onOpen }) => {
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
          mb: 0.5,
        }}
      >
        Administración
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mb: 1.5 }}>
        Usuarios de la aplicación
      </Typography>

      <Box
        component="button"
        type="button"
        onClick={onOpen}
        sx={{
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          backgroundColor: appColors.accent,
          color: appColors.onAccent,
          borderRadius: '12px',
          py: 1.5,
          fontSize: 14,
          fontWeight: 700,
          '&:hover': { backgroundColor: appColors.accentLight },
        }}
      >
        Agregar Usuario de Aplicación
      </Box>
    </Box>
  );
};
