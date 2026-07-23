import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,

  IconButton,
  Chip,
  Stack,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Appointment } from '@domain/entities/Appointment';
import { APPOINTMENT_CONSTANTS } from '@shared/constants/appointments';
import { formatDate, formatCurrency } from '@shared/utils/formatters';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onMove?: (appointment: Appointment) => void;
}

/**
 * AppointmentList: Tabla de citas con acciones
 *
 * Features:
 * - Muestra citas en tabla
 * - Badges de estado y método de pago
 * - Acciones contextuales (edit, delete, complete, cancel)
 * - Responsive
 */
export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading = false,
  onEdit,
  onDelete,
  onComplete,
  onCancel,
  onMove,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, apt: Appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(apt);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAppointment(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'primary';
    }
  };

  if (appointments.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No hay citas para mostrar
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'background.default' }}>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Fecha
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Hora
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Servicio</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Precio
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Estado
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Pago
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow
                key={appointment.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {appointment.clientName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{appointment.phone}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {formatDate(new Date(appointment.date))}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">{appointment.time}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {appointment.serviceName || '-'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {appointment.servicePrice ? formatCurrency(appointment.servicePrice) : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={APPOINTMENT_CONSTANTS.STATUS_LABELS[appointment.status]}
                    color={getStatusColor(appointment.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  {appointment.paymentMethodUsed ? (
                    <Chip
                      label={APPOINTMENT_CONSTANTS.PAYMENT_METHOD_LABELS[appointment.paymentMethodUsed]}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" justifyContent="center" spacing={0.5}>
                    {/* Quick Actions */}
                    {appointment.status === 'scheduled' && (
                      <>
                        {onComplete && (
                          <IconButton
                            size="small"
                            title="Completar"
                            onClick={() => onComplete(appointment)}
                            disabled={isLoading}
                          >
                            <CheckCircleIcon fontSize="small" color="success" />
                          </IconButton>
                        )}
                        {onCancel && (
                          <IconButton
                            size="small"
                            title="Cancelar"
                            onClick={() => onCancel(appointment)}
                            disabled={isLoading}
                          >
                            <CancelIcon fontSize="small" color="error" />
                          </IconButton>
                        )}
                      </>
                    )}

                    {/* More Actions */}
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, appointment)}
                      disabled={isLoading}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={!!selectedAppointment} onClose={handleMenuClose}>
        {onEdit && selectedAppointment && (
          <MenuItem onClick={() => handleAction(() => onEdit(selectedAppointment))}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {onMove && selectedAppointment?.status === 'scheduled' && (
          <MenuItem onClick={() => handleAction(() => onMove(selectedAppointment))}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Mover
          </MenuItem>
        )}
        {onDelete && selectedAppointment && (
          <MenuItem
            onClick={() => handleAction(() => onDelete(selectedAppointment))}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
