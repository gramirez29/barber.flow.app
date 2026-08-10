import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import {
  ClientForm,
  ClientCard,
  ClientsSummaryCard,
  ClientsEmptyState,
} from '@presentation/components/clients';
import { useClients } from '@presentation/hooks/useClients';
import { CreateClientFormData } from '@shared/validation/clientSchemas';
import { Client } from '@domain/entities/Client';
import { useConfirmDialog } from '@presentation/context/ConfirmDialogContext';
import { appColors } from '@presentation/theme/appColors';
import heroImage from '@/assets/images/barber-flow-background-image.jpg';

export const ClientsPage: React.FC = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { clients, isLoadingClients, searchClients, createClient, updateClient, deleteClient } = useClients();
  const { confirm } = useConfirmDialog();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleOpenCreateForm = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleFormSubmit = async (data: CreateClientFormData) => {
    if (editingClient) {
      await updateClient(editingClient.id!, { ...data, id: editingClient.id! });
    } else {
      await createClient(data);
    }
  };

  const handleDelete = async (client: Client) => {
    const confirmed = await confirm({
      title: 'Eliminar cliente',
      message: `¿Eliminar a ${client.firstName} ${client.lastName}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteClient(client.id!);
    } catch {
      // Error ya manejado por el hook
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        backgroundImage: `linear-gradient(${appColors.overlay}, ${appColors.overlay}), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
        backgroundAttachment: 'fixed',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ClientsSummaryCard
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={clients.length}
          isLoading={isLoadingClients}
          onNewClient={handleOpenCreateForm}
        />

        <Box
          sx={{
            backgroundColor: appColors.surface,
            borderRadius: '20px',
            border: `1px solid ${appColors.border}`,
            p: 2.5,
            boxShadow: '0 4px 12px rgba(201, 168, 76, 0.08)',
          }}
        >
          {clients.length === 0 ? (
            <ClientsEmptyState loading={isLoadingClients} />
          ) : (
            clients.map((client) => (
              <ClientCard key={client.id} client={client} onClick={handleSelectClient} onDelete={handleDelete} />
            ))
          )}
        </Box>
      </Box>

      <ClientForm
        key={editingClient?.id ?? 'new'}
        open={formOpen}
        title={editingClient ? `${editingClient.firstName} ${editingClient.lastName}` : 'Nuevo cliente'}
        client={editingClient}
        onSubmit={handleFormSubmit}
        onClose={handleCloseForm}
        isLoading={isLoadingClients}
      />
    </Box>
  );
};
