import React, { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import { format } from 'date-fns';
import {
  DashboardHeroCard,
  DashboardMetricsGrid,
  DashboardSafeModeNotice,
  DashboardQuickLinks,
} from '@presentation/components/dashboard';
import { useAuth } from '@presentation/context/AuthContext';
import { useAdminAccess } from '@presentation/context/AdminAccessContext';
import { useReports } from '@presentation/hooks/useReports';
import { useAppointments } from '@presentation/hooks/useAppointments';
import { useClients } from '@presentation/hooks/useClients';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

const todayKey = () => format(new Date(), 'yyyy-MM-dd');

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isSafeModeEnabled } = useAdminAccess();
  const operationalScreensLocked = user?.role === 'Admin' && isSafeModeEnabled;

  const { report, isLoadingReports, goToToday } = useReports();
  const { appointments, isLoadingAppointments, fetchAppointmentsByDate } = useAppointments();
  const { clients, isLoadingClients, searchClients } = useClients();

  useEffect(() => {
    if (operationalScreensLocked) return;
    goToToday();
    fetchAppointmentsByDate(todayKey());
    searchClients('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationalScreensLocked]);

  const pendingAppointmentsToday = useMemo(
    () => appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length,
    [appointments]
  );

  const isLoading = isLoadingReports || isLoadingAppointments || isLoadingClients;

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
        <DashboardHeroCard userName={user?.name} />

        {operationalScreensLocked ? (
          <DashboardSafeModeNotice />
        ) : (
          <DashboardMetricsGrid
            appointmentsToday={appointments.length}
            pendingAppointmentsToday={pendingAppointmentsToday}
            customersServedToday={report?.totalCustomersServed ?? 0}
            grossRevenueToday={report?.grossRevenue ?? 0}
            totalClients={clients.length}
            isLoading={isLoading}
          />
        )}

        <DashboardQuickLinks operationalScreensLocked={operationalScreensLocked} />
      </Box>
    </Box>
  );
};
