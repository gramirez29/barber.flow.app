/**
 * Client Constants
 * Constantes relacionadas con clientes
 */

export const CLIENT_CONSTANTS = {
  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    SINPE_MOVIL: 'sinpe_movil',
    TRANSFER: 'transfer',
    NONE: 'none',
  } as const,

  PAYMENT_METHOD_LABELS: {
    cash: 'Efectivo',
    sinpe_movil: 'SINPE Móvil',
    transfer: 'Transferencia',
    none: 'No especificado',
  } as const,

  // Validación
  MIN_PHONE_LENGTH: 8,
  MAX_PHONE_LENGTH: 12,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,

  // Messages
  MESSAGES: {
    CREATE_SUCCESS: 'Cliente creado correctamente',
    UPDATE_SUCCESS: 'Cliente actualizado correctamente',
    DELETE_SUCCESS: 'Cliente eliminado correctamente',
    DELETE_CONFIRM: '¿Estás seguro de que deseas eliminar este cliente?',
    ERROR: 'Error al procesar el cliente',
  },
};
