import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
  ReportHeroCard,
  ReportMetricsGrid,
  ReportFormulaCard,
  ReportCollectionsCard,
  ReportAttendanceList,
} from '@presentation/components/reports';
import { useReports } from '@presentation/hooks/useReports';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const ReportsPage: React.FC = () => {
  const {
    report,
    selectedDate,
    isLoadingReports,
    reportError,
    fetchDailyReport,
    goToToday,
    setSelectedDate,
  } = useReports();

  useEffect(() => {
    goToToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchDailyReport(date);
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(${appColors.overlay}, ${appColors.overlay}), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        backgroundAttachment: 'fixed',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ReportHeroCard
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onToday={goToToday}
          isLoading={isLoadingReports}
        />

        {reportError && !isLoadingReports ? (
          <Box
            sx={{
              backgroundColor: appColors.surface,
              borderRadius: '20px',
              border: `1px solid ${appColors.error}`,
              p: 2.5,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: appColors.textPrimary, mb: 0.75 }}>
              No se pudo cargar el reporte
            </Typography>
            <Typography sx={{ fontSize: 13, color: appColors.textSecondary, mb: 2 }}>
              {reportError}
            </Typography>
            <Box
              component="button"
              onClick={() => fetchDailyReport(selectedDate)}
              sx={{
                border: `1px solid ${appColors.accent}`,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: appColors.accent,
                borderRadius: '12px',
                px: 2.5,
                py: 1,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Reintentar
            </Box>
          </Box>
        ) : (
          <>
            <ReportMetricsGrid
              totalCustomersServed={report?.totalCustomersServed ?? 0}
              grossRevenue={report?.grossRevenue ?? 0}
              netProfit={report?.netProfit ?? 0}
              isLoading={isLoadingReports}
            />

            <ReportFormulaCard
              commissionAmount={report?.commissionAmount ?? 0}
              fixedDailyExpense={report?.fixedDailyExpense ?? 0}
            />

            <ReportCollectionsCard paymentMethodBreakdown={report?.paymentMethodBreakdown ?? []} />

            <ReportAttendanceList completedAppointments={report?.completedAppointments ?? []} />
          </>
        )}
      </Box>
    </Box>
  );
};
