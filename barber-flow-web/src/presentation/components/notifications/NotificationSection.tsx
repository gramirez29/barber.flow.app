import React, { useState } from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
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
  /** When set, only this many items show at first and "Ver más" reveals another page. */
  pageSize?: number;
}

export const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  description,
  items,
  emptyTitle,
  emptyBody,
  onOpen,
  onDismiss,
  pageSize,
}) => {
  const [visibleCount, setVisibleCount] = useState(pageSize ?? Number.MAX_SAFE_INTEGER);

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
          items
            .slice(0, visibleCount)
            .map((item) => <NotificationItemCard key={item.id} item={item} onOpen={onOpen} onDismiss={onDismiss} />)
        ) : (
          <NotificationsEmptyState title={emptyTitle} body={emptyBody} />
        )}
        {pageSize && items.length > visibleCount ? (
          <ButtonBase
            onClick={() => setVisibleCount((count) => count + pageSize)}
            sx={{
              border: `1px solid ${appColors.accent}`,
              borderRadius: 999,
              py: 1.5,
              color: appColors.accent,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {`Ver más (${items.length - visibleCount} restantes)`}
          </ButtonBase>
        ) : null}
      </Box>
    </Box>
  );
};
