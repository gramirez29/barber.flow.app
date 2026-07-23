import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { useAuth } from '@presentation/context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Bienvenido, {user?.name}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Citas Hoy</Typography>
          <Typography variant="h4" sx={{ my: 1, fontWeight: 700 }}>0</Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Clientes</Typography>
          <Typography variant="h4" sx={{ my: 1, fontWeight: 700 }}>0</Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Ingresos Hoy</Typography>
          <Typography variant="h4" sx={{ my: 1, fontWeight: 700 }}>₡0</Typography>
        </Paper>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Citas Pendientes</Typography>
          <Typography variant="h4" sx={{ my: 1, fontWeight: 700 }}>0</Typography>
        </Paper>
      </Box>
    </Container>
  );
};
