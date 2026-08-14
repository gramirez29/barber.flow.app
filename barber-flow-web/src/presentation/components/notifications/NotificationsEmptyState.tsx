import React from 'react';
import { Box, Typography } from '@mui/material';
import { appColors } from '@presentation/theme/appColors';

interface NotificationsEmptyStateProps {
  title: string;
  body: string;
}

export const NotificationsEmptyState: React.FC<NotificationsEmptyStateProps> = ({ title, body }) => {
  return (
    <Box
      sx={{
        border: `1px dashed ${appColors.border}`,
        borderRadius: '14px',
        p: 2.5,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: appColors.textPrimary, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, color: appColors.textSecondary, lineHeight: '19px' }}>{body}</Typography>
    </Box>
  );
};
