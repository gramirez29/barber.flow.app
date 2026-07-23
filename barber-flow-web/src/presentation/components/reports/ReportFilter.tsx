import React, { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';

interface ReportFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  isLoading: boolean;
}

/**
 * ReportFilter: Controles para navegación de fechas
 *
 * Features:
 * - Selector de fecha
 * - Botones siguiente/anterior
 * - Ir a hoy
 * - Rango de fechas (futuro)
 */
export const ReportFilter: React.FC<ReportFilterProps> = ({
  selectedDate,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
  isLoading,
}) => {
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(selectedDate);
  const [endDate, setEndDate] = useState(selectedDate);

  const handleRangeSubmit = () => {
    // TODO: Implementar búsqueda por rango una vez backend lo soporte
    setRangeDialogOpen(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-CR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        {/* Date Navigation */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flex: 1 }}>
          <Tooltip title="Día anterior">
            <span>
              <IconButton
                onClick={onPreviousDay}
                disabled={isLoading}
                size="small"
                sx={{ backgroundColor: '#fff' }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </span>
          </Tooltip>

          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            disabled={isLoading}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: '150px' }}
          />

          <Tooltip title="Día siguiente">
            <span>
              <IconButton
                onClick={onNextDay}
                disabled={isLoading}
                size="small"
                sx={{ backgroundColor: '#fff' }}
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Tooltip title="Ir a hoy">
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={onToday}
              disabled={isLoading}
              size="small"
            >
              Hoy
            </Button>
          </Tooltip>

          <Tooltip title="Buscar por rango (próximamente)">
            <span>
              <Button
                variant="outlined"
                startIcon={<DateRangeIcon />}
                onClick={() => setRangeDialogOpen(true)}
                disabled={true} // TODO: Enable cuando backend lo soporte
                size="small"
              >
                Rango
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Date Display */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Box
          sx={{
            display: 'inline-block',
            p: 2,
            backgroundColor: '#e3f2fd',
            borderRadius: 1,
            borderLeft: '4px solid #2196f3',
          }}
        >
          <h3 style={{ margin: 0, color: '#1976d2' }}>{formatDateDisplay(selectedDate)}</h3>
        </Box>
      </Box>

      {/* Range Dialog - TODO */}
      <Dialog open={rangeDialogOpen} onClose={() => setRangeDialogOpen(false)}>
        <DialogTitle>Buscar por Rango de Fechas</DialogTitle>
        <DialogContent sx={{ minWidth: '400px', pt: 2 }}>
          <TextField
            label="Desde"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
          <TextField
            label="Hasta"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRangeDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleRangeSubmit} variant="contained">
            Buscar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
