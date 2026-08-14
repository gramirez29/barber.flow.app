import { useState, useCallback, useMemo } from 'react';
import { Client } from '@domain/entities/Client';
import { CreateClientRequest, UpdateClientRequest } from '@application/dtos/requests';
import { useNotification } from '@presentation/context/NotificationContext';
import { ClientApi } from '@infrastructure/api/ClientApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';

/**
 * useClients: Hook para manejo de clientes
 *
 * Proporciona:
 * - Listado de clientes
 * - Crear/editar/eliminar clientes
 * - Buscar clientes
 * - Obtener estadísticas de cliente
 *
 * Ejemplo:
 * ```tsx
 * const {
 *   clients,
 *   isLoading,
 *   searchClients,
 *   createClient,
 *   updateClient,
 *   deleteClient,
 * } = useClients();
 *
 * useEffect(() => {
 *   searchClients('');
 * }, []);
 * ```
 */
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const { showNotification } = useNotification();

  // Inyectar ClientApi
  const clientApi = useMemo(() => new ClientApi(new AxiosHttpClient()), []);

  /**
   * Buscar clientes
   */
  const searchClients = useCallback(
    async (query: string) => {
      setIsLoadingClients(true);
      try {
        const data = await clientApi.search(query);
        setClients(data);
        showNotification('Búsqueda de clientes completada', 'success');
      } catch (error) {
        const message = getErrorMessage(error, 'Error en búsqueda de clientes');
        showNotification(message, 'error');
      } finally {
        setIsLoadingClients(false);
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Obtener cliente por ID
   */
  const getClient = useCallback(
    async (id: string) => {
      try {
        const data = await clientApi.getById(id);
        setSelectedClient(data);
        return data;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al obtener cliente');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Crear nuevo cliente
   */
  const createClient = useCallback(
    async (clientData: CreateClientRequest) => {
      try {
        const newClient = await clientApi.create(clientData);
        setClients((prev) => [...prev, newClient]);
        showNotification('Cliente creado correctamente', 'success');
        return newClient;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al crear cliente');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Actualizar cliente
   */
  const updateClient = useCallback(
    async (clientId: string, updates: UpdateClientRequest) => {
      try {
        const updatedClient = await clientApi.update(clientId, updates);
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? updatedClient : c))
        );
        showNotification('Cliente actualizado correctamente', 'success');
        return updatedClient;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al actualizar cliente');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Eliminar cliente
   */
  const deleteClient = useCallback(
    async (clientId: string) => {
      try {
        await clientApi.delete(clientId);
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        showNotification('Cliente eliminado correctamente', 'success');
      } catch (error) {
        const message = getErrorMessage(error, 'Error al eliminar cliente');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Obtener estadísticas del cliente
   */
  const getClientStats = useCallback(
    async (clientId: string) => {
      try {
        const stats = await clientApi.getStats(clientId);
        return stats;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al obtener estadísticas');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  /**
   * Obtener historial de citas del cliente
   */
  const getAppointmentHistory = useCallback(
    async (clientId: string) => {
      try {
        const history = await clientApi.getAppointmentHistory(clientId);
        return history;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al obtener historial');
        showNotification(message, 'error');
        throw error;
      }
    },
    [clientApi, showNotification]
  );

  return {
    // State
    clients,
    selectedClient,
    isLoadingClients,

    // Methods
    searchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    getClientStats,
    getAppointmentHistory,

    // Setters
    setSelectedClient,
  };
}
