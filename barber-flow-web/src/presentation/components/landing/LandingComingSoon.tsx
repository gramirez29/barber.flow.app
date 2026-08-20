import React from 'react';
import { Box, Typography } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import { appColors } from '@presentation/theme/appColors';

export const LandingComingSoon: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.background,
        px: { xs: 2.5, sm: 4 },
        pb: { xs: 6, md: 9 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1080,
          mx: 'auto',
          backgroundColor: appColors.surface,
          border: `1px solid ${appColors.border}`,
          borderRadius: '16px',
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 5 },
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
          <ConstructionIcon sx={{ fontSize: 22, color: appColors.accent }} />
        </Box>
        <Typography sx={{ color: appColors.textPrimary, fontSize: 20, fontWeight: 700 }}>
          Contenido relevante
        </Typography>
        <Typography sx={{ color: appColors.textSecondary, fontSize: 14, lineHeight: '21px', maxWidth: 480 }}>
          Estamos preparando guías, novedades y recursos para barberías. Muy pronto vas a encontrar
          más contenido acá.
        </Typography>
        <Typography
          sx={{
            color: appColors.accent,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            mt: 0.5,
          }}
        >
          En construcción
        </Typography>
      </Box>
    </Box>
  );
};
