import React from 'react';
import { Box, Typography } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { appColors } from '@presentation/theme/appColors';
import { useAuth } from '@presentation/context/AuthContext';

/**
 * Pantalla de bloqueo por falta de pago. Se muestra en lugar de toda la app
 * (sin AppBar/Drawer) cuando el usuario autenticado tiene isBlocked === true.
 */
export const BlockedPage: React.FC = () => {
  const { logout } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: appColors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: appColors.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <ContentCutIcon sx={{ fontSize: 26, color: appColors.onAccent }} />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 2,
          }}
        >
          <BlockOutlinedIcon sx={{ color: appColors.error, fontSize: 22 }} />
          <Typography sx={{ color: appColors.textPrimary, fontSize: 22, fontWeight: 700 }}>
            Cuenta bloqueada
          </Typography>
        </Box>

        <Typography sx={{ color: appColors.textSecondary, fontSize: 15, lineHeight: '22px', mb: 4 }}>
          El acceso a esta cuenta fue suspendido por falta de pago del servicio. Contacta al
          administrador para regularizar tu situación y recuperar el acceso.
        </Typography>

        <Box
          component="button"
          type="button"
          onClick={() => void logout()}
          sx={{
            border: `1px solid ${appColors.border}`,
            backgroundColor: 'transparent',
            color: appColors.textSecondary,
            borderRadius: '12px',
            px: 3,
            py: 1.25,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { borderColor: appColors.accent, color: appColors.textPrimary },
          }}
        >
          Cerrar sesión
        </Box>
      </Box>
    </Box>
  );
};
