import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Stack, CircularProgress } from '@mui/material';
import { DailyReportStats } from '@domain/entities';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventNoteIcon from '@mui/icons-material/EventNote';

interface ReportStatsProps {
  stats: DailyReportStats | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon, color, isLoading }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography color="textSecondary" gutterBottom>
                {title}
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 700, color }}>
                    {value}
                  </Typography>
                  {subtitle && (
                    <Typography variant="caption" color="textSecondary">
                      {subtitle}
                    </Typography>
                  )}
                </>
              )}
            </Box>
            <Box sx={{ fontSize: '2rem', color, opacity: 0.7 }}>{icon}</Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * ReportStats: Componente de tarjetas con estadísticas diarias
 *
 * Muestra:
 * - Total de citas
 * - Ingresos totales
 * - Ingresos por método de pago
 * - Gastos
 * - Ingresos netos
 */
export const ReportStats: React.FC<ReportStatsProps> = ({ stats, isLoading }) => {
  if (!stats && !isLoading) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* Total Appointments */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Citas"
          value={stats?.totalAppointments || 0}
          icon={<EventNoteIcon />}
          color="#3B82F6"
          isLoading={isLoading}
        />
      </Grid>

      {/* Cash Income */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Efectivo"
          value={formatCurrency(stats?.incomeByCurrency?.cash || 0)}
          icon={<TrendingUpIcon />}
          color="#10B981"
          isLoading={isLoading}
        />
      </Grid>

      {/* SINPE Income */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="SINPE"
          value={formatCurrency(stats?.incomeByCurrency?.sinpeMovil || 0)}
          icon={<TrendingUpIcon />}
          color="#C9A84C"
          isLoading={isLoading}
        />
      </Grid>

      {/* Transfer Income */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Transferencia"
          value={formatCurrency(stats?.incomeByCurrency?.transfer || 0)}
          icon={<TrendingUpIcon />}
          color="#3B82F6"
          isLoading={isLoading}
        />
      </Grid>

      {/* Net Income */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Ingresos Netos"
          value={formatCurrency(stats?.netIncome || 0)}
          icon={<TrendingUpIcon />}
          color={stats?.netIncome ? '#10B981' : '#EF4444'}
          isLoading={isLoading}
        />
      </Grid>

      {/* Expenses */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Gastos"
          value={formatCurrency(stats?.expenses || 0)}
          icon={<TrendingDownIcon />}
          color="#EF4444"
          isLoading={isLoading}
        />
      </Grid>

      {/* Total Income */}
      <Grid item xs={12} sm={6} md={2.4}>
        <StatCard
          title="Ingresos Totales"
          value={formatCurrency(stats?.totalIncome || 0)}
          icon={<TrendingUpIcon />}
          color="#C9A84C"
          isLoading={isLoading}
        />
      </Grid>
    </Grid>
  );
};
