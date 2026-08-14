import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

export const DashboardSafeModeNotice: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1.5px solid ${appColors.error}`,
        p: 2.5,
      }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>
        Métricas ocultas por Modo Seguro
      </Typography>
      <Box
        sx={{
          mt: 1.5,
          borderRadius: '12px',
          border: `1px solid ${appColors.error}`,
          backgroundColor: appColors.errorBg,
          px: 1.75,
          py: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: appColors.error }}>
          🔒 Estás usando la aplicación como Administrador con el Modo Seguro activo, así que las
          citas, clientes e ingresos del día no se muestran aquí. Ve a Configuración si necesitas
          desactivarlo temporalmente.
        </Typography>
      </Box>
    </Box>
  );
};
