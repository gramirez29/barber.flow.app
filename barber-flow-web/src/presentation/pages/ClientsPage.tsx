import React, { useEffect, useState } from 'react';
import { Box, Fab } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import {
  ClientForm,
  ClientCard,
  ClientsSummaryCard,
  ClientsEmptyState,
  ClientsPagination,
} from '@presentation/components/clients';
import { useClients } from '@presentation/hooks/useClients';
import { useClientPagination } from '@presentation/hooks/useClientPagination';
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
  const { page, pageSize, totalPages, pageItems, setPage, setPageSize, resetPage } =
    useClientPagination(clients);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

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
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <ClientsSummaryCard
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          totalCount={clients.length}
          isLoading={isLoadingClients}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />

        {clients.length === 0 ? (
          <ClientsEmptyState loading={isLoadingClients} />
        ) : (
          <Box>
            {pageItems.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={handleSelectClient}
                onDelete={handleDelete}
                isFirst={index === 0}
                isLast={index === pageItems.length - 1}
              />
            ))}
          </Box>
        )}

        {!isLoadingClients && <ClientsPagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </Box>

      <Fab
        aria-label="Nuevo cliente"
        onClick={handleOpenCreateForm}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          backgroundColor: appColors.accent,
          color: appColors.onAccent,
          '&:hover': { backgroundColor: appColors.accentLight },
        }}
      >
        <PersonAddIcon />
      </Fab>

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
