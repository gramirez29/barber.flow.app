import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import {
  ReportHeroCard,
  ReportMetricsGrid,
  ReportFormulaCard,
  ReportCollectionsCard,
  ReportAttendanceList,
  ReportDaysDetail,
} from '@presentation/components/reports';
import { useReports } from '@presentation/hooks/useReports';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const ReportsPage: React.FC = () => {
  const {
    period,
    report,
    periodReport,
    selectedDate,
    isLoadingReports,
    reportError,
    fetchReport,
    changePeriod,
    goToToday,
    goToPrevious,
    goToNext,
  } = useReports();

  useEffect(() => {
    goToToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateChange = (date: string) => {
    fetchReport(date, period);
  };

  const isDaily = period === 'daily';
  // Semana y mes: el reporte del periodo; mientras llega el del nuevo periodo se muestra en blanco, no el anterior.
  const currentPeriodReport = !isDaily && periodReport?.periodType === period ? periodReport : null;

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(${appColors.overlay}, ${appColors.overlay}), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ReportHeroCard
          period={period}
          onPeriodChange={changePeriod}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onToday={goToToday}
          onPrevious={goToPrevious}
          onNext={goToNext}
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
              onClick={() => fetchReport(selectedDate, period)}
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
        ) : isDaily ? (
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
        ) : (
          <>
            <ReportMetricsGrid
              totalCustomersServed={currentPeriodReport?.totalCustomersServed ?? 0}
              grossRevenue={currentPeriodReport?.grossRevenue ?? 0}
              netProfit={currentPeriodReport?.netProfit ?? 0}
              isLoading={isLoadingReports}
            />

            <ReportFormulaCard
              period={period}
              commissionAmount={currentPeriodReport?.commissionAmount ?? 0}
              fixedDailyExpense={currentPeriodReport?.fixedDailyExpense ?? 0}
              fixedExpenseTotal={currentPeriodReport?.fixedExpenseTotal ?? 0}
              countedDays={currentPeriodReport?.countedDays ?? 0}
            />

            <ReportCollectionsCard
              period={period}
              paymentMethodBreakdown={currentPeriodReport?.paymentMethodBreakdown ?? []}
            />

            {/* key: al cambiar de semana a mes (o de periodo) el detalle vuelve a quedar oculto */}
            {currentPeriodReport && (
              <ReportDaysDetail
                key={`${currentPeriodReport.periodType}-${currentPeriodReport.from}`}
                days={currentPeriodReport.days}
                onSelectDay={(date) => fetchReport(date, 'daily')}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};
