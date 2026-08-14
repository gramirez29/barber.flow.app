import React from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { appColors } from '@presentation/theme/appColors';

interface ClientsSummaryCardProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  isLoading?: boolean;
  onNewClient: () => void;
}

export const ClientsSummaryCard: React.FC<ClientsSummaryCardProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
  isLoading = false,
  onNewClient,
}) => {
  return (
    <Box
      sx={{
        backgroundColor: appColors.surface,
        borderRadius: '20px',
        border: `1px solid ${appColors.border}`,
        p: 2.5,
        boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: appColors.accent,
            }}
          >
            Clientes
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: appColors.textPrimary }}>
            Base de clientes
          </Typography>
          <Typography sx={{ fontSize: 14, color: appColors.textSecondary }}>
            {totalCount} {totalCount === 1 ? 'cliente registrado' : 'clientes registrados'}
          </Typography>
        </Box>

        <Box
          component="button"
          onClick={onNewClient}
          disabled={isLoading}
          sx={{
            border: 'none',
            cursor: 'pointer',
            backgroundColor: appColors.accent,
            borderRadius: '14px',
            height: 44,
            px: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 8px ${appColors.accent}59`,
            color: appColors.onAccent,
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '0.3px',
            opacity: isLoading ? 0.6 : 1,
            '&:hover': { backgroundColor: appColors.accentLight },
          }}
        >
          Nuevo Cliente
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mt: 2,
          backgroundColor: appColors.surfaceElevated,
          borderRadius: '12px',
          border: `1px solid ${appColors.border}`,
          px: 1.5,
        }}
      >
        <SearchIcon sx={{ color: appColors.textSecondary, fontSize: 20, mr: 1 }} />
        <InputBase
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            py: 1.25,
            fontSize: 15,
            color: appColors.textPrimary,
            '& input::placeholder': { color: appColors.textSecondary, opacity: 1 },
          }}
        />
      </Box>
    </Box>
  );
};
