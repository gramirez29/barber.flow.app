import React from 'react';
import { Box, Typography } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { appColors } from '@presentation/theme/appColors';

const STEPS = [
  {
    icon: PersonAddAltOutlinedIcon,
    title: 'Creá tu cuenta',
    description: 'Tu administrador te da acceso y configurás tu barbería en minutos.',
  },
  {
    icon: EventAvailableOutlinedIcon,
    title: 'Agendá citas y clientes',
    description: 'Llevá tu calendario y tus fichas de clientes desde un solo lugar.',
  },
  {
    icon: InsightsOutlinedIcon,
    title: 'Mirá tu reporte diario',
    description: 'Ingresos, comisión y ganancia neta del día, sin cuentas a mano.',
  },
];

export const LandingHowItWorks: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.background,
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
          Cómo funciona
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
          Tres pasos y listo
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: { xs: 3, md: 3 },
          }}
        >
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <Box
              key={title}
              sx={{
                backgroundColor: appColors.surface,
                border: `1px solid ${appColors.border}`,
                borderRadius: '16px',
                p: { xs: 2.5, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1.25,
                position: 'relative',
              }}
            >
              <Typography
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  color: appColors.border,
                  fontSize: 40,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {index + 1}
              </Typography>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  backgroundColor: `${appColors.accent}1a`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon sx={{ fontSize: 22, color: appColors.accent }} />
              </Box>
              <Typography sx={{ color: appColors.textPrimary, fontSize: 16, fontWeight: 700 }}>
                {title}
              </Typography>
              <Typography sx={{ color: appColors.textSecondary, fontSize: 13, lineHeight: '19px' }}>
                {description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
