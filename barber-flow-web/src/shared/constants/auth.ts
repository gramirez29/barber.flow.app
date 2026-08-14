/**
 * Authentication Constants
 * Constantes relacionadas con el sistema de autenticación
 */

export const AUTH_CONSTANTS = {
  // Tokens
  TOKEN_STORAGE_KEY: 'barber_flow_auth_token',
  USER_STORAGE_KEY: 'barber_flow_user',
  REFRESH_TOKEN_KEY: 'barber_flow_refresh_token',

  // Duraciones
  TOKEN_EXPIRY_BUFFER_MS: 5 * 60 * 1000, // 5 minutos antes de expirar
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutos de inactividad
  OTP_EXPIRY_MS: 10 * 60 * 1000, // 10 minutos
  OTP_RESEND_COOLDOWN_MS: 60 * 1000, // 1 minuto

  // Validación
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 50,
  MIN_OTP_LENGTH: 6,

  // Mensajes
  MESSAGES: {
    SESSION_EXPIRED: 'Tu sesión expiró. Por favor inicia sesión de nuevo.',
    INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',
    USER_NOT_FOUND: 'El usuario no fue encontrado',
    EMAIL_NOT_FOUND: 'No encontramos una cuenta con ese email',
    INVALID_OTP: 'El código OTP es inválido o expiró',
    PASSWORD_RESET_SUCCESS: 'Tu contraseña ha sido actualizada correctamente',
    LOGIN_SUCCESS: '¡Bienvenido!',
    LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
    OTP_SENT: 'Código OTP enviado a tu email',
    OTP_RESEND_COOLDOWN: 'Espera un momento antes de solicitar otro código',
  },

  // Errores
  ERRORS: {
    NETWORK_ERROR: 'Error de conexión. Verifica tu internet',
    UNAUTHORIZED: 'No estás autorizado',
    FORBIDDEN: 'No tienes permisos',
    SERVER_ERROR: 'Error del servidor. Por favor intenta más tarde',
    VALIDATION_ERROR: 'Error de validación en los campos',
  },
};
