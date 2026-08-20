import React from 'react';
import { Box, Typography } from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { appColors } from '@presentation/theme/appColors';

const DEVELOPER_NAME = 'Guillermo Ramirez';
const CONTACT_EMAIL = 'g.raba29@gmail.com';
const CONTACT_PHONE = '(506) 7018-9220';
const PRIVACY_POLICY_URL =
  import.meta.env.VITE_PRIVACY_POLICY_URL || 'https://barberflowapp-develop.up.railway.app/privacy-policy';

const linkSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  color: appColors.textSecondary,
  fontSize: 13,
  textDecoration: 'none',
  '&:hover': { color: appColors.accent },
};

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: appColors.surface,
        borderTop: `1px solid ${appColors.border}`,
        mt: 'auto',
      }}
    >
      <Box
        sx={{
          maxWidth: 720,
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '12px',
                backgroundColor: appColors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ContentCutIcon sx={{ fontSize: 13, color: appColors.onAccent }} />
            </Box>
            <Typography sx={{ color: appColors.accent, fontSize: 12, fontWeight: 800, letterSpacing: '1.5px' }}>
              HAIRCUTSFLOW
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.25, sm: 2.5 } }}>
            <Box component="a" href={`mailto:${CONTACT_EMAIL}`} sx={linkSx}>
              <EmailOutlinedIcon sx={{ fontSize: 14 }} />
              {CONTACT_EMAIL}
            </Box>
            <Box component="a" href={`tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`} sx={linkSx}>
              <PhoneOutlinedIcon sx={{ fontSize: 14 }} />
              {CONTACT_PHONE}
            </Box>
            <Box component="a" href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" sx={linkSx}>
              Política de privacidad
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 1,
            pt: 1,
            borderTop: `1px solid ${appColors.border}`,
          }}
        >
          <Typography sx={{ fontSize: 11, color: appColors.textSecondary }}>
            © {year} HairCutsFlow. Todos los derechos reservados.
          </Typography>
          <Typography sx={{ fontSize: 11, color: appColors.textSecondary }}>
            Desarrollado por {DEVELOPER_NAME}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
