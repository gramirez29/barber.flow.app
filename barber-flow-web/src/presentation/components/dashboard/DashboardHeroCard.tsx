import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { formatDate } from '@shared/utils/formatters';

interface DashboardHeroCardProps {
  userName?: string;
}

export const DashboardHeroCard: React.FC<DashboardHeroCardProps> = ({ userName }) => {
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
        Resumen del día
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: appColors.textPrimary, mt: 0.5 }}>
        {userName ? `Hola, ${userName}` : 'Bienvenido'}
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, mt: 0.5, textTransform: 'capitalize' }}>
        {formatDate(new Date())}
      </Typography>
    </Box>
  );
};
