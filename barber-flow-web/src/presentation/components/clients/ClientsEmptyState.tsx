import React from 'react';
import { Box, Typography } from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { appColors } from '@presentation/theme/appColors';

interface ClientsEmptyStateProps {
  loading?: boolean;
}

export const ClientsEmptyState: React.FC<ClientsEmptyStateProps> = ({ loading = false }) => {
  const Icon = loading ? HourglassEmptyIcon : PeopleOutlineIcon;

  return (
    <Box
      sx={{
        textAlign: 'center',
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        backgroundColor: appColors.surface,
        mt: 1.5,
        px: 2.5,
        py: 3.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.25,
      }}
    >
      <Icon sx={{ fontSize: 28, color: appColors.textSecondary }} />
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: appColors.textPrimary }}>
        {loading ? 'Cargando clientes...' : 'Sin clientes todavía'}
      </Typography>
      <Typography sx={{ fontSize: 14, color: appColors.textSecondary, lineHeight: 1.5 }}>
        {loading
          ? 'Estamos buscando tus clientes.'
          : 'Usa el botón "Nuevo Cliente" para agregar el primero a tu base de datos.'}
      </Typography>
    </Box>
  );
};
