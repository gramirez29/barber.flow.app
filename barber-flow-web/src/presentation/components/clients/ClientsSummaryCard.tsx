import React from 'react';
import { Box, Typography, InputBase } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { appColors } from '@presentation/theme/appColors';
import { CLIENT_PAGE_SIZE_OPTIONS, ClientPageSize } from '@presentation/hooks/useClientPagination';

interface ClientsSummaryCardProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
  isLoading?: boolean;
  pageSize: ClientPageSize;
  onPageSizeChange: (size: ClientPageSize) => void;
}

export const ClientsSummaryCard: React.FC<ClientsSummaryCardProps> = ({
  searchQuery,
  onSearchChange,
  totalCount,
  isLoading = false,
  pageSize,
  onPageSizeChange,
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
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: appColors.accent,
          mb: 1,
        }}
      >
        Directorio de clientes
      </Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 700, color: appColors.textPrimary, mb: 1 }}>
        Espacio de clientes
      </Typography>
      <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: appColors.textSecondary }}>
        Revisa clientes, abre un registro para editarlo o crea uno nuevo desde el menú flotante.
      </Typography>

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
        <SearchIcon sx={{ color: appColors.textSecondary, fontSize: 18, mr: 1 }} />
        <InputBase
          placeholder="Buscar por nombre, teléfono o correo"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          inputProps={{ autoCapitalize: 'none', autoCorrect: 'off', 'aria-label': 'Buscar clientes' }}
          sx={{
            flex: 1,
            py: 1.25,
            fontSize: 15,
            color: appColors.textPrimary,
            '& input::placeholder': { color: appColors.textSecondary, opacity: 1 },
          }}
        />
      </Box>

      <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: appColors.textSecondary, mt: 1.5 }}>
        Toca cualquier cliente para actualizar la información registrada en el sistema.
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1.75 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: appColors.textSecondary,
          }}
        >
          Por página:
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {CLIENT_PAGE_SIZE_OPTIONS.map((size) => {
            const active = pageSize === size;
            return (
              <Box
                key={size}
                component="button"
                type="button"
                onClick={() => onPageSizeChange(size)}
                aria-pressed={active}
                sx={{
                  cursor: 'pointer',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 600,
                  px: 1.5,
                  py: '5px',
                  borderRadius: '8px',
                  border: `1px solid ${active ? appColors.accent : appColors.border}`,
                  backgroundColor: active ? `${appColors.accent}1f` : 'transparent',
                  color: active ? appColors.accent : appColors.textSecondary,
                }}
              >
                {size}
              </Box>
            );
          })}
        </Box>
        {!isLoading && totalCount > 0 && (
          <Typography sx={{ fontSize: 12, color: appColors.textSecondary, ml: 'auto', opacity: 0.75 }}>
            {totalCount} {totalCount === 1 ? 'cliente' : 'clientes'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
