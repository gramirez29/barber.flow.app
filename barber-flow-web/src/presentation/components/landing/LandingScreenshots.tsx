import React, { useState } from 'react';
import { Box, IconButton, Modal, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  const [openedSrc, setOpenedSrc] = useState<string | null>(null);
  const openedScreenshot = SCREENSHOTS.find((s) => s.src === openedSrc);

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
                onClick={() => setOpenedSrc(src)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setOpenedSrc(src);
                }}
                sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `1px solid ${appColors.border}`,
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.35)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.45)',
                  },
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

      <Modal
        open={openedSrc !== null}
        onClose={() => setOpenedSrc(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: { xs: '90vw', sm: '85vw', md: '75vw' },
            maxHeight: { xs: '80vh', sm: '85vh' },
            outline: 'none',
          }}
        >
          <IconButton
            onClick={() => setOpenedSrc(null)}
            aria-label="Cerrar"
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: -44 },
              right: { xs: 8, sm: 0 },
              backgroundColor: appColors.surfaceElevated,
              border: `1px solid ${appColors.border}`,
              color: appColors.textPrimary,
              zIndex: 1,
              '&:hover': { backgroundColor: appColors.surface },
            }}
          >
            <CloseIcon />
          </IconButton>
          {openedScreenshot && (
            <Box
              component="img"
              src={openedScreenshot.src}
              alt={openedScreenshot.alt}
              sx={{
                display: 'block',
                width: 'auto',
                height: 'auto',
                maxWidth: { xs: '90vw', sm: '85vw', md: '75vw' },
                maxHeight: { xs: '80vh', sm: '85vh' },
                borderRadius: '12px',
                border: `1px solid ${appColors.border}`,
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};
