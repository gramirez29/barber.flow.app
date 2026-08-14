// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/users/authentication',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  APPOINTMENTS: {
    CREATE: '/api/appointments/create',
    UPDATE: '/api/appointments/update',
    DELETE: '/api/appointments/delete',
    GET_BY_ID: '/api/appointments/getById',
    SEARCH: '/api/appointments/search',
    MOVE: '/api/appointments/move',
  },
  CLIENTS: {
    CREATE: '/api/clients/create',
    UPDATE: '/api/clients/update',
    DELETE: '/api/clients/delete',
    GET_BY_ID: '/api/clients/getById',
    SEARCH: '/api/clients/search',
    HISTORY: '/api/clients/{id}/appointments/history',
    STATS: '/api/clients/{id}/stats',
  },
  REPORTS: {
    DAILY: '/api/reports/daily',
  },
};

// Status messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Iniciaste sesión correctamente',
    LOGOUT: 'Sesión cerrada',
    CREATE: 'Creado exitosamente',
    UPDATE: 'Actualizado exitosamente',
    DELETE: 'Eliminado exitosamente',
  },
  ERROR: {
    LOGIN: 'Usuario o contraseña incorrectos',
    NETWORK: 'Error de conexión',
    UNEXPECTED: 'Algo salió mal',
  },
};

// Appointment statuses
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Efectivo' },
  { value: 'Sinpe Movil', label: 'SINPE Móvil' },
  { value: 'Transfer', label: 'Transferencia' },
];
