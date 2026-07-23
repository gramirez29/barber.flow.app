import React from 'react';
import { Box, Container, Typography } from '@mui/material';

export const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Configuración</Typography>
      </Box>
      <Typography variant="body1" color="textSecondary">
        Configuración en desarrollo...
      </Typography>
    </Container>
  );
};
