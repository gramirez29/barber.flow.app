import React from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface AdminAccessCardProps {
  isSafeModeEnabled: boolean;
  onToggle: (value: boolean) => void;
}

export const AdminAccessCard: React.FC<AdminAccessCardProps> = ({ isSafeModeEnabled, onToggle }) => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1.5px solid ${appColors.error}`,
        p: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>
            Habilitar pantallas de operación
          </Typography>
          <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mt: 0.5, lineHeight: 1.5 }}>
            Activa para mostrar Citas, Clientes y Reportes con esta cuenta de Administrador.
          </Typography>
        </Box>
        <Switch
          checked={!isSafeModeEnabled}
          onChange={(e) => onToggle(!e.target.checked)}
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: appColors.error },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
              backgroundColor: appColors.error,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          borderRadius: '12px',
          border: `1px solid ${isSafeModeEnabled ? appColors.error : appColors.accent}`,
          backgroundColor: isSafeModeEnabled ? appColors.errorBg : `${appColors.accent}22`,
          px: 1.75,
          py: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.5,
            color: isSafeModeEnabled ? appColors.error : appColors.accentLight,
          }}
        >
          {isSafeModeEnabled
            ? '🔒 Estás usando la aplicación como Administrador. Citas, Clientes y Reportes están ocultos: esta cuenta es solo para dar acceso a otras personas, no debe usarse para crear, editar, eliminar ni consultar citas o clientes.'
            : '⚠️ Modo de prueba activo: las pantallas de operación están visibles con la cuenta de Administrador. Úsalo solo para pruebas y vuelve a activar el bloqueo cuando termines.'}
        </Typography>
      </Box>
    </Box>
  );
};
