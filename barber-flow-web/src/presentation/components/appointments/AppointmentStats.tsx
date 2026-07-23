import React from 'react';
import { Card, Typography, Button, Stack, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface AppointmentStatsProps {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  totalIncome?: number;
  isLoading?: boolean;
  onNewAppointment?: () => void;
}

/**
 * AppointmentStats: Tarjetas de estadísticas de citas
 *
 * Muestra:
 * - Total de citas
 * - Citas programadas
 * - Citas completadas
 * - Ingresos totales (opcional)
 */
export const AppointmentStats: React.FC<AppointmentStatsProps> = ({
  totalAppointments,
  scheduledAppointments,
  completedAppointments,
  totalIncome,
  isLoading = false,
  onNewAppointment,
}) => {
  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Citas de Hoy
        </Typography>
        {onNewAppointment && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onNewAppointment}
            disabled={isLoading}
          >
            Nueva Cita
          </Button>
        )}
      </Stack>

      {isLoading && <CircularProgress />}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {/* Total Citas */}
        <Card sx={{ p: 2.5, flex: 1, backgroundColor: 'primary.lighter' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
            Total de Citas
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {totalAppointments}
          </Typography>
        </Card>

        {/* Citas Programadas */}
        <Card sx={{ p: 2.5, flex: 1, backgroundColor: 'info.lighter' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
            Programadas
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
            {scheduledAppointments}
          </Typography>
        </Card>

        {/* Citas Completadas */}
        <Card sx={{ p: 2.5, flex: 1, backgroundColor: 'success.lighter' }}>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
            Completadas
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
            {completedAppointments}
          </Typography>
        </Card>

        {/* Ingresos (opcional) */}
        {totalIncome !== undefined && (
          <Card sx={{ p: 2.5, flex: 1, backgroundColor: 'warning.lighter' }}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
              Ingresos
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
              ₡{totalIncome.toLocaleString()}
            </Typography>
          </Card>
        )}
      </Stack>
    </Stack>
  );
};
