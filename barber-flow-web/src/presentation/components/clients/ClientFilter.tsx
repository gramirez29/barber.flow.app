import React from 'react';
import { Box, TextField, Button, Stack, Chip, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface ClientFilterProps {
  onSearch?: (query: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

/**
 * ClientFilter: Barra de búsqueda y filtros para clientes
 *
 * Features:
 * - Búsqueda por nombre, email o teléfono
 * - Reset de filtros
 * - Responsive
 */
export const ClientFilter: React.FC<ClientFilterProps> = ({
  onSearch,
  onReset,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    onReset?.();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const hasFilters = searchQuery;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Search Bar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            placeholder="Buscar por nombre, email o teléfono..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="outlined"
            onClick={handleSearch}
            disabled={isLoading || !searchQuery}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Buscar
          </Button>
          {hasFilters && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={handleReset}
              disabled={isLoading}
              size="small"
            >
              Limpiar
            </Button>
          )}
        </Stack>

        {/* Active Filters Display */}
        {hasFilters && (
          <Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {searchQuery && (
                <Chip
                  label={`Búsqueda: "${searchQuery}"`}
                  onDelete={() => {
                    setSearchQuery('');
                    onSearch?.('');
                  }}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
