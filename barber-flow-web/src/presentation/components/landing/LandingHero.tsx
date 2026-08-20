import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { Link as RouterLink } from 'react-router-dom';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const LandingHero: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 30px)', md: 'calc(92vh - 30px)' },
        width: '100%',
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          backgroundColor: appColors.overlay,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            px: { xs: 2, sm: 4 },
            py: 2.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '18px',
                backgroundColor: appColors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ContentCutIcon sx={{ fontSize: 18, color: appColors.onAccent }} />
            </Box>
            <Typography
              sx={{
                color: appColors.accent,
                fontSize: { xs: 13, sm: 15 },
                fontWeight: 800,
                letterSpacing: { xs: '1.5px', sm: '2.5px' },
                whiteSpace: 'nowrap',
              }}
            >
              HAIRCUTSFLOW
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to="/login"
            sx={{
              height: 42,
              px: { xs: 2, sm: 3 },
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              borderRadius: '999px',
              backgroundColor: appColors.accent,
              color: appColors.onAccent,
              fontSize: { xs: 12, sm: 13 },
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              '&:hover': { backgroundColor: appColors.accentLight },
            }}
          >
            Iniciar sesión
          </Button>
        </Box>

        {/* Value proposition */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: 3,
            py: { xs: 4, md: 0 },
          }}
        >
          <Typography
            sx={{
              color: appColors.textPrimary,
              fontSize: { xs: 34, sm: 48, md: 56 },
              fontWeight: 700,
              lineHeight: 1.15,
              maxWidth: 780,
              mb: 2.5,
            }}
          >
            La forma más simple de gestionar tu barbería.
          </Typography>
          <Typography
            sx={{
              color: appColors.heroBodyText,
              fontSize: { xs: 15, sm: 17 },
              lineHeight: '26px',
              maxWidth: 560,
              mb: 4.5,
            }}
          >
            Citas, clientes, reportes y notificaciones en un único espacio profesional, pensado
            para barberías que quieren operar con confianza.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
