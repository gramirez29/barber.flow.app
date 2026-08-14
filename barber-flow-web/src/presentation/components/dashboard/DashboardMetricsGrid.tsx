import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';
import { formatCurrency } from '@shared/utils/formatters';

interface DashboardMetricsGridProps {
  appointmentsToday: number;
  pendingAppointmentsToday: number;
  customersServedToday: number;
  grossRevenueToday: number;
  totalClients: number;
  isLoading?: boolean;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  appointmentsToday,
  pendingAppointmentsToday,
  customersServedToday,
  grossRevenueToday,
  totalClients,
  isLoading = false,
}) => {
  const cards = [
    { label: 'Citas hoy', value: String(appointmentsToday) },
    { label: 'Citas pendientes', value: String(pendingAppointmentsToday) },
    { label: 'Clientes atendidos hoy', value: String(customersServedToday) },
    { label: 'Ingresos hoy', value: formatCurrency(grossRevenueToday) },
    { label: 'Total clientes', value: String(totalClients) },
  ];

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      {cards.map((card) => (
        <Box
          key={card.label}
          sx={{
            backgroundColor: appColors.surface,
            borderRadius: '18px',
            border: `1px solid ${appColors.border}`,
            flexGrow: 1,
            minWidth: 150,
            px: 2,
            py: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: appColors.textSecondary,
              mb: 1.25,
            }}
          >
            {card.label}
          </Typography>
          {isLoading ? (
            <CircularProgress size={20} sx={{ color: appColors.accent }} />
          ) : (
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: appColors.textPrimary }}>
              {card.value}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};
