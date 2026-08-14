import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

const APP_VERSION = '1.0.0';
const DEVELOPER_NAME = 'Guillermo Ramirez';
const PRIVACY_POLICY_URL =
  import.meta.env.VITE_PRIVACY_POLICY_URL || 'https://barberflowapp-develop.up.railway.app/privacy-policy';

export const AboutCard: React.FC = () => {
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
          color: appColors.textSecondary,
          mb: 0.5,
        }}
      >
        Acerca de
      </Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: appColors.textPrimary, mb: 2 }}>
        Barber Flow Web
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${appColors.border}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: appColors.textSecondary }}>
          Versión
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>{APP_VERSION}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${appColors.border}` }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: appColors.textSecondary }}>
          Desarrollador
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>{DEVELOPER_NAME}</Typography>
      </Box>

      <Box
        component="a"
        href={PRIVACY_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          pt: 1.5,
          textDecoration: 'none',
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: appColors.textSecondary }}>
          Política de privacidad
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.accent }}>Leer más</Typography>
      </Box>
    </Box>
  );
};
