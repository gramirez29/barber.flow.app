import React from 'react';
import { Box, Typography } from '@mui/material';
import { DateRange, People, BarChart, Settings, SvgIconComponent } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { appColors } from '@presentation/theme/appColors';

interface QuickLink {
  label: string;
  path: string;
  icon: SvgIconComponent;
  operational: boolean;
}

const QUICK_LINKS: QuickLink[] = [
  { label: 'Citas', path: '/appointments', icon: DateRange, operational: true },
  { label: 'Clientes', path: '/clients', icon: People, operational: true },
  { label: 'Reportes', path: '/reports', icon: BarChart, operational: true },
  { label: 'Configuración', path: '/settings', icon: Settings, operational: false },
];

interface DashboardQuickLinksProps {
  operationalScreensLocked: boolean;
}

export const DashboardQuickLinks: React.FC<DashboardQuickLinksProps> = ({ operationalScreensLocked }) => {
  const navigate = useNavigate();

  const visibleLinks = operationalScreensLocked
    ? QUICK_LINKS.filter((link) => !link.operational)
    : QUICK_LINKS;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      {visibleLinks.map((link) => (
        <Box
          key={link.path}
          component="button"
          onClick={() => navigate(link.path)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: `1px solid ${appColors.border}`,
            cursor: 'pointer',
            backgroundColor: appColors.surface,
            borderRadius: '14px',
            flexGrow: 1,
            minWidth: 140,
            px: 2,
            py: 1.5,
            '&:hover': { backgroundColor: appColors.surfaceElevated, borderColor: appColors.accent },
          }}
        >
          <link.icon sx={{ color: appColors.accent, fontSize: 20 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: appColors.textPrimary }}>
            {link.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
