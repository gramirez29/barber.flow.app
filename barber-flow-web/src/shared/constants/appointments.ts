/**
 * Appointment Constants
 * Constantes relacionadas con citas
 */

export const APPOINTMENT_CONSTANTS = {
  // Estatuses
  STATUSES: {
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  } as const,

  STATUS_LABELS: {
    scheduled: 'Programada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  } as const,

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    SINPE_MOVIL: 'sinpe_movil',
    TRANSFER: 'transfer',
  } as const,

  PAYMENT_METHOD_LABELS: {
    cash: 'Efectivo',
    sinpe_movil: 'SINPE Móvil',
    transfer: 'Transferencia',
    none: 'No especificado',
  } as const,

  // Horarios
  DEFAULT_SERVICE_DURATION: 30, // minutos
  MIN_TIME_BETWEEN_APPOINTMENTS: 15, // minutos
  WORKING_HOURS: {
    START: '09:00',
    END: '17:00',
  },

  // Validación
  MIN_ADVANCE_BOOKING: 30, // minutos
  MAX_ADVANCE_BOOKING: 90, // días
  MIN_PHONE_LENGTH: 8,
  MAX_PRICE: 9999.99,

  // Messages
  MESSAGES: {
    CREATE_SUCCESS: 'Cita creada correctamente',
    UPDATE_SUCCESS: 'Cita actualizada correctamente',
    DELETE_SUCCESS: 'Cita eliminada correctamente',
    MOVE_SUCCESS: 'Cita movida correctamente',
    COMPLETE_SUCCESS: 'Cita marcada como completada',
    CANCEL_SUCCESS: 'Cita cancelada',
    FETCH_ERROR: 'Error al cargar citas',
    CREATE_ERROR: 'Error al crear cita',
    UPDATE_ERROR: 'Error al actualizar cita',
    DELETE_ERROR: 'Error al eliminar cita',
    MOVE_ERROR: 'Error al mover cita',
    TIME_CONFLICT: 'Ya existe una cita en ese horario',
    INVALID_TIME: 'Hora fuera del horario de trabajo',
  },

  // Defaults
  DEFAULT_STATUS: 'scheduled' as const,
  DEFAULT_PAYMENT_METHOD: 'cash' as const,
};

export type AppointmentStatus = typeof APPOINTMENT_CONSTANTS.STATUSES[keyof typeof APPOINTMENT_CONSTANTS.STATUSES];
export type PaymentMethod = typeof APPOINTMENT_CONSTANTS.PAYMENT_METHODS[keyof typeof APPOINTMENT_CONSTANTS.PAYMENT_METHODS];
