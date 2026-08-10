import { useState, useCallback, useMemo } from 'react';
import { Barber } from '@domain/entities/Barber';
import { CreateBarberRequest, UpdateBarberRequest } from '@application/dtos/requests';
import { useNotification } from '@presentation/context/NotificationContext';
import { BarberApi } from '@infrastructure/api/BarberApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';

/**
 * useBarbers: Hook para manejo de cuentas de Barbero (usuarios de la aplicación)
 */
export function useBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
  const { showNotification } = useNotification();

  const barberApi = useMemo(() => new BarberApi(new AxiosHttpClient()), []);

  const searchBarbers = useCallback(
    async (query?: string) => {
      setIsLoadingBarbers(true);
      try {
        const data = await barberApi.search(query);
        setBarbers(data);
        return data;
      } catch (error) {
        const message = getErrorMessage(error, 'Error en búsqueda de usuarios de aplicación');
        showNotification(message, 'error');
        return [];
      } finally {
        setIsLoadingBarbers(false);
      }
    },
    [barberApi, showNotification]
  );

  const getBarberByUserName = useCallback(
    async (userName: string): Promise<Barber | null> => {
      try {
        const results = await barberApi.search(userName);
        return (
          results.find((b) => b.userName.toLowerCase() === userName.toLowerCase()) ?? null
        );
      } catch {
        return null;
      }
    },
    [barberApi]
  );

  const createBarber = useCallback(
    async (request: CreateBarberRequest) => {
      try {
        const created = await barberApi.create(request);
        showNotification('Usuario de aplicación creado correctamente', 'success');
        return created;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al crear usuario de aplicación');
        showNotification(message, 'error');
        throw error;
      }
    },
    [barberApi, showNotification]
  );

  const updateBarber = useCallback(
    async (id: string, request: UpdateBarberRequest) => {
      try {
        const updated = await barberApi.update(id, request);
        showNotification('Usuario de aplicación actualizado correctamente', 'success');
        return updated;
      } catch (error) {
        const message = getErrorMessage(error, 'Error al actualizar usuario de aplicación');
        showNotification(message, 'error');
        throw error;
      }
    },
    [barberApi, showNotification]
  );

  const deleteBarber = useCallback(
    async (id: string) => {
      try {
        await barberApi.delete(id);
        setBarbers((prev) => prev.filter((b) => b.id !== id));
        showNotification('Usuario de aplicación eliminado correctamente', 'success');
      } catch (error) {
        const message = getErrorMessage(error, 'Error al eliminar usuario de aplicación');
        showNotification(message, 'error');
        throw error;
      }
    },
    [barberApi, showNotification]
  );

  const getNextBarberId = useCallback(async () => {
    return barberApi.getNextId();
  }, [barberApi]);

  return {
    barbers,
    isLoadingBarbers,

    searchBarbers,
    getBarberByUserName,
    createBarber,
    updateBarber,
    deleteBarber,
    getNextBarberId,
  };
}
