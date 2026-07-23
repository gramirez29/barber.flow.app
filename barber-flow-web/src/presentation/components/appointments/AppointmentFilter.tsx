import React from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';

interface AppointmentFilterProps {
  onSearch?: (query: string) => void;
  onFilterByStatus?: (status: string | null) => void;
  onFilterByDate?: (date: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

/**
 * AppointmentFilter: Barra de búsqueda y filtros para citas
 *
 * Features:
 * - Búsqueda por cliente/teléfono
 * - Filtro por estado
 * - Filtro por fecha
 * - Reset de filtros
 */
export const AppointmentFilter: React.FC<AppointmentFilterProps> = ({
  onSearch,
  onFilterByStatus,
  onFilterByDate,
  onReset,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState('');

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  const handleStatusChange = (status: string | null) => {
    setSelectedStatus(status);
    onFilterByStatus?.(status);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    onFilterByDate?.(date);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedStatus(null);
    setSelectedDate('');
    onReset?.();
  };

  const hasFilters = searchQuery || selectedStatus || selectedDate;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Search Bar */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            placeholder="Buscar por cliente o teléfono..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
        </Stack>

        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {/* Status Filter */}
          <TextField
            label="Estado"
            size="small"
            select
            value={selectedStatus || ''}
            onChange={(e) => handleStatusChange(e.target.value || null)}
            disabled={isLoading}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">- Todos -</MenuItem>
            <MenuItem value="scheduled">Programadas</MenuItem>
            <MenuItem value="completed">Completadas</MenuItem>
            <MenuItem value="cancelled">Canceladas</MenuItem>
          </TextField>

          {/* Date Filter */}
          <TextField
            label="Fecha"
            type="date"
            size="small"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={isLoading}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          {/* Reset Button */}
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
                />
              )}
              {selectedStatus && (
                <Chip
                  label={`Estado: ${APPOINTMENT_CONSTANTS.STATUS_LABELS[selectedStatus as keyof typeof APPOINTMENT_CONSTANTS.STATUS_LABELS]}`}
                  onDelete={() => handleStatusChange(null)}
                  size="small"
                />
              )}
              {selectedDate && (
                <Chip
                  label={`Fecha: ${selectedDate}`}
                  onDelete={() => handleDateChange('')}
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
