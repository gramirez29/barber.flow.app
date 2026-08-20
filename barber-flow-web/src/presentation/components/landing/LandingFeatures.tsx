import React from 'react';
import { Box, Typography } from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { appColors } from '@presentation/theme/appColors';

// Same icon set already used per feature in SidebarDrawer.tsx, reused here for visual consistency.
const FEATURES = [
  {
    icon: DateRangeIcon,
    title: 'Citas',
    description: 'Agenda y calendario de tu barbería, siempre a la vista.',
  },
  {
    icon: PeopleIcon,
    title: 'Clientes',
    description: 'Fichas de clientes con historial de citas y preferencias.',
  },
  {
    icon: BarChartIcon,
    title: 'Reportes',
    description: 'Ingresos, comisiones y ganancia neta del día, en tiempo real.',
  },
  {
    icon: NotificationsOutlinedIcon,
    title: 'Notificaciones',
    description: 'Avisos de citas próximas y clientes sin agendar hace tiempo.',
  },
];

export const LandingFeatures: React.FC = () => {
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
          Todo en un solo lugar
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
          Lo que necesitás para operar tu barbería
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            gap: { xs: 2, md: 3 },
          }}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Box
              key={title}
              sx={{
                backgroundColor: appColors.surface,
                border: `1px solid ${appColors.border}`,
                borderRadius: '16px',
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
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
