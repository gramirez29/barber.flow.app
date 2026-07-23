import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

interface ReportAppointment {
  id: string;
  clientName: string;
  time: string;
  status: string;
  amount: number;
  paymentMethod: string;
}

interface ReportTableProps {
  appointments: ReportAppointment[];
  isLoading: boolean;
}

const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  completed: 'success',
  cancelled: 'error',
  scheduled: 'info',
};

const statusLabels: Record<string, string> = {
  completed: 'Completada',
  cancelled: 'Cancelada',
  scheduled: 'Agendada',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  sinpe: 'SINPE',
  sinpeMovil: 'SINPE',
  transfer: 'Transferencia',
  none: 'Sin pago',
};

/**
 * ReportTable: Tabla con todas las citas del día
 *
 * Muestra:
 * - Hora de la cita
 * - Cliente
 * - Teléfono
 * - Servicio
 * - Precio
 * - Método de pago
 * - Estado
 */
export const ReportTable: React.FC<ReportTableProps> = ({ appointments, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (appointments.length === 0) {
    return <Alert severity="info">No hay citas para este día</Alert>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Hora</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Pago</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {apt.time}
                </Typography>
              </TableCell>
              <TableCell>{apt.clientName}</TableCell>
              <TableCell align="right">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>
                  {formatCurrency(apt.amount)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={paymentMethodLabels[apt.paymentMethod] || 'N/A'}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={statusLabels[apt.status]}
                  size="small"
                  color={statusColors[apt.status]}
                  variant="filled"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
