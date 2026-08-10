import React from 'react';
import { Box, Typography } from '@mui/material';
import { NotificationItem } from '@shared/types/notifications';
import { appColors } from '@presentation/theme/appColors';
import { NotificationItemCard } from './NotificationItemCard';
import { NotificationsEmptyState } from './NotificationsEmptyState';

interface NotificationSectionProps {
  title: string;
  description: string;
  items: NotificationItem[];
  emptyTitle: string;
  emptyBody: string;
  onOpen: (item: NotificationItem) => void;
  onDismiss: (notificationId: string) => void;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  description,
  items,
  emptyTitle,
  emptyBody,
  onOpen,
  onDismiss,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: appColors.textPrimary }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, color: appColors.textSecondary, lineHeight: '20px', mt: 0.25 }}>
          {description}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <NotificationItemCard key={item.id} item={item} onOpen={onOpen} onDismiss={onDismiss} />
          ))
        ) : (
          <NotificationsEmptyState title={emptyTitle} body={emptyBody} />
        )}
      </Box>
    </Box>
  );
};
