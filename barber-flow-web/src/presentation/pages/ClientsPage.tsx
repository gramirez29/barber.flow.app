import React, { useState } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  ClientForm,
  ClientList,
  ClientFilter,
} from '@presentation/components/clients';
import { useClients } from '@presentation/hooks/useClients';
import { useNotification } from '@presentation/context/NotificationContext';
import { CreateClientFormData } from '@shared/validation/clientSchemas';
import { Client } from '@domain/entities/Client';

/**
 * ClientsPage: Página de gestión de clientes
 *
 * Features:
 * - Listar clientes
 * - Crear nuevos clientes
 * - Editar clientes existentes
 * - Eliminar clientes
 * - Buscar y filtrar clientes
 * - Ver detalles del cliente
 */
export const ClientsPage: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();

  const {
    clients,
    isLoadingClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients();

  // TODO: Reemplazar con datos reales cuando se integre el backend
  const mockClients: Client[] = [];
  const displayClients = clients.length > 0 ? clients : mockClients;

  // Filtrar clientes según búsqueda
  const filteredClients = displayClients.filter((client) => {
    const matchesSearch =
      !searchQuery ||
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesSearch;
  });

  // Manejar creación/edición de clientes
  const handleFormSubmit = async (data: CreateClientFormData) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id!, data as any);
        setEditingClient(null);
      } else {
        await createClient(data);
      }
      setFormOpen(false);
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
    } else {
      setEditingClient(null);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleEdit = (client: Client) => {
    handleOpenForm(client);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`¿Eliminar cliente ${client.firstName} ${client.lastName}?`)) {
      try {
        await deleteClient(client.id!);
      } catch (error) {
        // Error ya manejado
      }
    }
  };

  const handleViewDetails = (client: Client) => {
    // TODO: Implementar página de detalles del cliente o modal
    showNotification(`Detalles de ${client.firstName} ${client.lastName}`, 'info');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchClients(query);
  };

  const handleReset = () => {
    setSearchQuery('');
    searchClients('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }} alignItems="center" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Clientes
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Gestiona la base de clientes de tu barbería
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          disabled={isLoadingClients}
        >
          Nuevo Cliente
        </Button>
      </Stack>

      {/* Filter */}
      <ClientFilter
        onSearch={handleSearch}
        onReset={handleReset}
        isLoading={isLoadingClients}
      />

      {/* Content */}
      <Box sx={{ mt: 3 }}>
        {isLoadingClients && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoadingClients && filteredClients.length === 0 && (
          <Alert severity="info">No hay clientes para mostrar</Alert>
        )}

        {!isLoadingClients && filteredClients.length > 0 && (
          <ClientList
            clients={filteredClients}
            isLoading={isLoadingClients}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        )}
      </Box>

      {/* Form Dialog */}
      <ClientForm
        open={formOpen}
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        client={editingClient}
        onSubmit={handleFormSubmit}
        onClose={handleCloseForm}
        isLoading={isLoadingClients}
      />
    </Container>
  );
};
