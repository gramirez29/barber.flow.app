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
import { Client } from '@domain/entities/Client';
import { CLIENT_CONSTANTS } from '@shared/constants/clients';
import { formatDate } from '@shared/utils/formatters';

interface ClientListProps {
  clients: Client[];
  isLoading?: boolean;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  onViewDetails?: (client: Client) => void;
}

/**
 * ClientList: Tabla de clientes con acciones
 *
 * Features:
 * - Muestra clientes en tabla
 * - Badges de método de pago
 * - Acciones contextuales (edit, delete, view)
 * - Responsive
 */
export const ClientList: React.FC<ClientListProps> = ({
  clients,
  isLoading = false,
  onEdit,
  onDelete,
  onViewDetails,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, client: Client) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  if (clients.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No hay clientes para mostrar
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
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Teléfono</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Dirección</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cumpleaños</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Método de Pago
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow
                key={client.id}
                sx={{
                  '&:hover': { backgroundColor: 'action.hover' },
                  opacity: isLoading ? 0.6 : 1,
                  cursor: onViewDetails ? 'pointer' : 'default',
                }}
                onClick={() => onViewDetails?.(client)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {client.firstName} {client.lastName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{client.email || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{client.phone}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {client.address || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    {client.birthday ? formatDate(new Date(client.birthday)) : '-'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {client.paymentMethod ? (
                    <Chip
                      label={CLIENT_CONSTANTS.PAYMENT_METHOD_LABELS[client.paymentMethod]}
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
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, client);
                      }}
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
      <Menu anchorEl={anchorEl} open={!!selectedClient} onClose={handleMenuClose}>
        {onEdit && selectedClient && (
          <MenuItem onClick={() => handleAction(() => onEdit(selectedClient))}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {onDelete && selectedClient && (
          <MenuItem
            onClick={() => handleAction(() => onDelete(selectedClient))}
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
