import React from 'react';
import { Box, Card, CardContent, Typography, Stack, LinearProgress, CircularProgress } from '@mui/material';
import { DailyReportStats } from '@domain/entities';

interface ReportChartProps {
  stats: DailyReportStats | null;
  isLoading: boolean;
}

/**
 * ReportChart: Visualización de ingresos por método de pago
 *
 * Muestra:
 * - Barras de ingresos por método (cash, SINPE, transfer)
 * - Porcentaje del total
 * - Comparativa visual
 */
export const ReportChart: React.FC<ReportChartProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!stats || !stats.totalIncome) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary">Sin datos para mostrar</Typography>
        </CardContent>
      </Card>
    );
  }

  const cash = stats.incomeByCurrency?.cash || 0;
  const sinpe = stats.incomeByCurrency?.sinpeMovil || 0;
  const transfer = stats.incomeByCurrency?.transfer || 0;
  const total = stats.totalIncome;

  const cashPercent = total > 0 ? (cash / total) * 100 : 0;
  const sinpePercent = total > 0 ? (sinpe / total) * 100 : 0;
  const transferPercent = total > 0 ? (transfer / total) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Ingresos por Método de Pago
        </Typography>

        <Stack spacing={3}>
          {/* Cash */}
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Efectivo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10B981' }}>
                {formatCurrency(cash)} ({cashPercent.toFixed(0)}%)
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={cashPercent} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          {/* SINPE */}
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                SINPE
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#C9A84C' }}>
                {formatCurrency(sinpe)} ({sinpePercent.toFixed(0)}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={sinpePercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(201, 168, 76, 0.12)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#C9A84C',
                },
              }}
            />
          </Box>

          {/* Transfer */}
          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Transferencia
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                {formatCurrency(transfer)} ({transferPercent.toFixed(0)}%)
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={transferPercent}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#3B82F6',
                },
              }}
            />
          </Box>

          {/* Total Summary */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              borderLeft: '4px solid #2196f3',
            }}
          >
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total Ingresos:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#2196f3', fontSize: '1.1em' }}>
                {formatCurrency(total)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};
