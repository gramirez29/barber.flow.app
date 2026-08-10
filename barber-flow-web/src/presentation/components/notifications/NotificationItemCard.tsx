import React from 'react';
import { Box, Typography } from '@mui/material';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { NotificationItem } from '@shared/types/notifications';
import { getNotificationDisplayText } from '@shared/utils/notificationService';
import { appColors } from '@presentation/theme/appColors';

interface NotificationItemCardProps {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
  onDismiss: (notificationId: string) => void;
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({ item, onOpen, onDismiss }) => {
  const copy = getNotificationDisplayText(item);
  const isDelayedClient = item.type === 'delayed-client-summary';

  return (
    <Box
      sx={{
        border: `1px solid ${appColors.border}`,
        borderRadius: '14px',
        backgroundColor: item.isRead ? appColors.background : appColors.surface,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${appColors.accentLight}29`,
          }}
        >
          {isDelayedClient ? (
            <ErrorOutlineIcon sx={{ color: appColors.error, fontSize: 20 }} />
          ) : (
            <EventOutlinedIcon sx={{ color: appColors.accent, fontSize: 20 }} />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: appColors.textPrimary }}>
            {copy.title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: appColors.textSecondary, textTransform: 'uppercase' }}>
            {isDelayedClient ? 'Requiere seguimiento' : 'Mañana'}
          </Typography>
        </Box>
        {!item.isRead && (
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: appColors.accent }} />
        )}
      </Box>

      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, lineHeight: '20px' }}>
        {copy.message}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box
          component="button"
          type="button"
          onClick={() => onOpen(item)}
          sx={{
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: appColors.accent,
            fontSize: 13,
            fontWeight: 600,
            p: 0.5,
          }}
        >
          Abrir
        </Box>
        <Box
          component="button"
          type="button"
          onClick={() => onDismiss(item.id)}
          sx={{
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: appColors.textSecondary,
            fontSize: 13,
            p: 0.5,
          }}
        >
          Descartar
        </Box>
      </Box>
    </Box>
  );
};
