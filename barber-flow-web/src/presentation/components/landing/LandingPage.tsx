import React, { useEffect, useState } from 'react';
import { Box, Fade, Typography } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

const MESSAGES = ['En Construcción', 'Under Construction'];
const MESSAGE_INTERVAL_MS = 3500;

export const LandingPage: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      const timeout = setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
      return () => clearTimeout(timeout);
    }, MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
      }}
    >
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: appColors.overlay,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '22px',
              backgroundColor: appColors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ContentCutIcon sx={{ fontSize: 22, color: appColors.onAccent }} />
          </Box>
          <Typography
            sx={{
              color: appColors.accent,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '3px',
            }}
          >
            HAIRCUTSFLOW
          </Typography>
        </Box>

        <Fade in={visible} timeout={300}>
          <Typography
            sx={{
              color: appColors.textPrimary,
              fontSize: { xs: 32, sm: 48 },
              fontWeight: 700,
              letterSpacing: '1px',
            }}
          >
            {MESSAGES[messageIndex]}
          </Typography>
        </Fade>

        <Typography
          sx={{
            color: appColors.heroBodyText,
            fontSize: 15,
            lineHeight: '22px',
            mt: 2,
            maxWidth: 480,
          }}
        >
          Estamos preparando esta página. Muy pronto tendrás toda la información de HairCutsFlow
          (HCFlow) aquí.
        </Typography>
      </Box>
    </Box>
  );
};
