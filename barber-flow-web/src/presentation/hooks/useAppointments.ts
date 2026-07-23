import { useState, useCallback } from 'react';
import { Appointment } from '@domain/entities/Appointment';
import { useNotification } from '@presentation/context/NotificationContext';
import { AppointmentApi } from '@infrastructure/api/AppointmentApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';

/**
 * useAppointments: Hook para manejo de citas
 *
 * Proporciona:
 * - Listado de citas por fecha
 * - Crear/editar/eliminar citas
 * - Buscar citas
 * - Mover citas a otro horario
 *
 * Ejemplo:
 * ```tsx
 * const {
 *   appointments,
 *   isLoading,
 *   error,
 *   fetchAppointmentsByDate,
 *   createAppointment,
 *   updateAppointment,
 *   deleteAppointment,
 *   moveAppointment,
 * } = useAppointments();
 *
 * useEffect(() => {
 *   fetchAppointmentsByDate('2024-12-25');
 * }, []);
 * ```
 */
export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const { showNotification } = useNotification();

  // Inyectar AppointmentApi
  const httpClient = new AxiosHttpClient();
  const appointmentApi = new AppointmentApi(httpClient);

  /**
   * Obtener citas por fecha
   */
  const fetchAppointmentsByDate = useCallback(
    async (date: string) => {
      setIsLoadingAppointments(true);
      try {
        const data = await appointmentApi.getByDate(date);
        setAppointments(data);
        showNotification('Citas cargadas correctamente', 'success');
      } catch (error: any) {
        const message = error?.message || 'Error al cargar citas';
        showNotification(message, 'error');
      } finally {
        setIsLoadingAppointments(false);
      }
    },
    [showNotification]
  );

  /**
   * Buscar citas
   */
  const searchAppointments = useCallback(
    async (query: string) => {
      setIsLoadingAppointments(true);
      try {
        const data = await appointmentApi.search(query);
        setAppointments(data);
        showNotification('Búsqueda completada', 'success');
      } catch (error: any) {
        const message = error?.message || 'Error en búsqueda';
        showNotification(message, 'error');
      } finally {
        setIsLoadingAppointments(false);
      }
    },
    [showNotification]
  );

  /**
   * Crear nueva cita
   */
  const createAppointment = useCallback(
    async (appointmentData: any) => {
      try {
        const newAppointment = await appointmentApi.create(appointmentData);
        setAppointments((prev) => [...prev, newAppointment]);
        showNotification('Cita creada correctamente', 'success');
        return newAppointment;
      } catch (error: any) {
        const message = error?.message || 'Error al crear cita';
        showNotification(message, 'error');
        throw error;
      }
    },
    [showNotification]
  );

  /**
   * Actualizar cita existente
   */
  const updateAppointment = useCallback(
    async (appointmentId: string, updates: any) => {
      try {
        const updated = await appointmentApi.update(appointmentId, updates);
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? updated : apt))
        );
        showNotification('Cita actualizada correctamente', 'success');
        return updated;
      } catch (error: any) {
        const message = error?.message || 'Error al actualizar cita';
        showNotification(message, 'error');
        throw error;
      }
    },
    [showNotification]
  );

  /**
   * Eliminar cita
   */
  const deleteAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        await appointmentApi.delete(appointmentId);
        setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
        showNotification('Cita eliminada correctamente', 'success');
      } catch (error: any) {
        const message = error?.message || 'Error al eliminar cita';
        showNotification(message, 'error');
        throw error;
      }
    },
    [showNotification]
  );

  /**
   * Mover cita a otro horario
   */
  const moveAppointment = useCallback(
    async (appointmentId: string, newDate: string, newTime: string) => {
      try {
        const updated = await appointmentApi.move(appointmentId, newDate, newTime);
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? updated : apt))
        );
        showNotification('Cita movida correctamente', 'success');
        return updated;
      } catch (error: any) {
        const message = error?.message || 'Error al mover cita';
        showNotification(message, 'error');
        throw error;
      }
    },
    [showNotification]
  );

  /**
   * Cambiar estado de cita (completed, cancelled)
   */
  const updateAppointmentStatus = useCallback(
    async (appointmentId: string, status: 'completed' | 'cancelled') => {
      try {
        const currentAppointment = appointments.find((apt) => apt.id === appointmentId);
        if (!currentAppointment) throw new Error('Cita no encontrada');
        
        const updated = await appointmentApi.update(appointmentId, {
          clientName: currentAppointment.clientName,
          phone: currentAppointment.phone,
          date: currentAppointment.date,
          time: currentAppointment.time,
          serviceName: currentAppointment.serviceName,
          servicePrice: currentAppointment.servicePrice,
          notes: currentAppointment.notes,
          status,
        });
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === appointmentId ? updated : apt))
        );
        showNotification(
          status === 'completed' ? 'Cita completada' : 'Cita cancelada',
          'success'
        );
        return updated;
      } catch (error: any) {
        const message = error?.message || 'Error al cambiar estado';
        showNotification(message, 'error');
        throw error;
      }
    },
    [appointments, showNotification]
  );

  return {
    // State
    appointments,
    selectedAppointment,
    isLoadingAppointments,

    // Actions
    fetchAppointmentsByDate,
    searchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    moveAppointment,
    updateAppointmentStatus,
    setSelectedAppointment,
  };
}
