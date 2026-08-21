import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { appColors } from '@presentation/theme/appColors';
import { getLoginHref } from './getLoginHref';

export const LandingFinalCta: React.FC = () => {
  const loginHref = getLoginHref();
  const isExternalLogin = loginHref.startsWith('http');

  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderTop: `1px solid ${appColors.border}`,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 5, md: 6 },
      }}
    >
      <Box
        sx={{
          maxWidth: 720,
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2.5,
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography sx={{ color: appColors.textPrimary, fontSize: 20, fontWeight: 700, mb: 0.5 }}>
            ¿Listo para organizar tu barbería?
          </Typography>
          <Typography sx={{ color: appColors.textSecondary, fontSize: 13 }}>
            Iniciá sesión y empezá a usar HairCutsFlow hoy mismo.
          </Typography>
        </Box>
        <Button
          component={isExternalLogin ? 'a' : RouterLink}
          {...(isExternalLogin ? { href: loginHref } : { to: loginHref })}
          sx={{
            flexShrink: 0,
            height: 48,
            px: 4,
            borderRadius: '14px',
            backgroundColor: appColors.accent,
            color: appColors.onAccent,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            boxShadow: `0 4px 10px 0 ${appColors.accent}66`,
            '&:hover': {
              backgroundColor: appColors.accentLight,
              boxShadow: `0 4px 10px 0 ${appColors.accent}66`,
            },
          }}
        >
          Iniciar sesión
        </Button>
      </Box>
    </Box>
  );
};
