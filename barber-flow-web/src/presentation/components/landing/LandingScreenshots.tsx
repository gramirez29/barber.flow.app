import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import screenshotCitas from '@/assets/images/landing/screenshot-citas.jpg';
import screenshotClientes from '@/assets/images/landing/screenshot-clientes.jpg';
import screenshotReportes from '@/assets/images/landing/screenshot-reportes.jpg';

// Real screenshots captured from the app with fictitious demo data — never real client data.
const SCREENSHOTS = [
  { src: screenshotCitas, alt: 'Agenda de citas de HairCutsFlow', title: 'Citas' },
  { src: screenshotClientes, alt: 'Base de clientes de HairCutsFlow', title: 'Clientes' },
  { src: screenshotReportes, alt: 'Reporte de cierre diario de HairCutsFlow', title: 'Reportes' },
];

export const LandingScreenshots: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 6, md: 9 },
      }}
    >
      <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
        <Typography
          sx={{
            color: appColors.accent,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textAlign: 'center',
            mb: 1,
          }}
        >
          Así se ve HairCutsFlow
        </Typography>
        <Typography
          sx={{
            color: appColors.textPrimary,
            fontSize: { xs: 26, sm: 32 },
            fontWeight: 700,
            textAlign: 'center',
            mb: { xs: 4, md: 6 },
          }}
        >
          La app real, en acción
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 3, md: 3 },
          }}
        >
          {SCREENSHOTS.map(({ src, alt, title }) => (
            <Box key={title}>
              <Box
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `1px solid ${appColors.border}`,
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
                }}
              >
                <Box component="img" src={src} alt={alt} sx={{ width: '100%', display: 'block' }} />
              </Box>
              <Typography
                sx={{
                  color: appColors.textSecondary,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                  mt: 1.5,
                }}
              >
                {title}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
