import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  NotificationsHeroCard,
  NotificationsDisabledCard,
  NotificationSection,
} from '@presentation/components/notifications';
import { useNotificationInbox } from '@presentation/context/NotificationInboxContext';
import { NotificationItem } from '@shared/types/notifications';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    notificationsEnabled,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificationInbox();

  const tomorrowNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'next-day-summary'),
    [notifications]
  );
  const delayedNotifications = useMemo(
    () => notifications.filter((item) => item.type === 'delayed-client-summary'),
    [notifications]
  );

  const handleOpen = (item: NotificationItem) => {
    markAsRead(item.id);
    navigate(item.payload.route === 'Calendar' ? '/appointments' : '/clients');
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
        <NotificationsHeroCard
          visibleCount={notifications.length}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onRefresh={() => void refreshNotifications()}
          onMarkAllAsRead={markAllAsRead}
        />

        {!notificationsEnabled ? (
          <NotificationsDisabledCard />
        ) : (
          <>
            <NotificationSection
              title="Mañana"
              description="Una notificación de resumen para las citas programadas de mañana."
              items={tomorrowNotifications}
              emptyTitle="No hay resumen para mañana"
              emptyBody="Cuando existan citas para mañana, la app las agrupará en un solo resumen diario de agenda."
              onOpen={handleOpen}
              onDismiss={dismissNotification}
            />

            <NotificationSection
              title="Requieren atención"
              description="Clientes que no han visitado recientemente y no tienen una cita futura."
              items={delayedNotifications}
              emptyTitle="No hay clientes atrasados"
              emptyBody="Los recordatorios de clientes atrasados aparecerán aquí cuando un cliente supere el umbral actual de seguimiento."
              onOpen={handleOpen}
              onDismiss={dismissNotification}
            />
          </>
        )}
      </Box>
    </Box>
  );
};
