import React, { useEffect } from 'react';
import { Container, Box, Typography, Stack, CircularProgress, Alert } from '@mui/material';
import { ReportStats, ReportTable, ReportFilter, ReportChart } from '@presentation/components/reports';
import { useReports } from '@presentation/hooks/useReports';

/**
 * ReportsPage: Página de reportes y análisis
 *
 * Features:
 * - Estadísticas del día (citas, ingresos por método)
 * - Tabla de citas con detalles de pago
 * - Gráfico de ingresos
 * - Navegación de fechas
 * - Búsqueda por rango (futuro)
 */
export const ReportsPage: React.FC = () => {
  const { report, stats, selectedDate, isLoadingReports, fetchDailyReport, previousDay, nextDay, goToToday, setSelectedDate } = useReports();

  // Cargar reporte del día actual al montar
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchDailyReport(today);
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchDailyReport(date);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Reportes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Análisis de citas e ingresos
          </Typography>
        </Box>
      </Stack>

      {/* Filter */}
      <ReportFilter
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onPreviousDay={previousDay}
        onNextDay={nextDay}
        onToday={goToToday}
        isLoading={isLoadingReports}
      />

      {/* Stats Cards */}
      <ReportStats stats={stats} isLoading={isLoadingReports} />

      {/* Charts and Tables */}
      <Stack spacing={3}>
        {/* Chart */}
        <Box>
          <ReportChart stats={stats} isLoading={isLoadingReports} />
        </Box>

        {/* Appointments Table */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Citas del Día
          </Typography>
          <ReportTable appointments={report?.appointments || []} isLoading={isLoadingReports} />
        </Box>
      </Stack>

      {/* Loading State */}
      {isLoadingReports && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {!isLoadingReports && !stats && (
        <Alert severity="warning">No se pudo cargar el reporte. Intenta nuevamente.</Alert>
      )}
    </Container>
  );
};
