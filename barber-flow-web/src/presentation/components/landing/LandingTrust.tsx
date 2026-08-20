import React from 'react';
import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { appColors } from '@presentation/theme/appColors';

export const LandingTrust: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 6, md: 8 },
      }}
    >
      <Box
        sx={{
          maxWidth: 720,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            backgroundColor: `${appColors.accent}1a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 0.5,
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 22, color: appColors.accent }} />
        </Box>
        <Typography sx={{ color: appColors.textPrimary, fontSize: 20, fontWeight: 700 }}>
          Tus datos, solo tuyos
        </Typography>
        <Typography sx={{ color: appColors.textSecondary, fontSize: 14, lineHeight: '21px', maxWidth: 520 }}>
          Cada barbero tiene su propia información de citas y clientes, privada y aislada del
          resto — nadie más en la barbería puede ver tus datos sin tu acceso.
        </Typography>
      </Box>
    </Box>
  );
};
