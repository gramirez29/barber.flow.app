import { useCallback } from 'react';
import { useNotification } from '@presentation/context/NotificationContext';

export interface ApiErrorInfo {
  message: string;
  statusCode?: number;
  errors?: Record<string, string>;
}

/**
 * useApiError: Hook para manejar errores de API de forma consistente
 *
 * Features:
 * - Extrae mensajes de error de diferentes formatos
 * - Muestra notificaciones automáticamente
 * - Soporta errores generales y por campo
 */
export function useApiError() {
  const { showNotification } = useNotification();

  const handleError = useCallback(
    (error: unknown, showToast: boolean = true): ApiErrorInfo => {
      let message = 'Ocurrió un error inesperado';
      let statusCode: number | undefined;
      let fieldErrors: Record<string, string> | undefined;

      const err = error as {
        response?: {
          status?: number;
          statusText?: string;
          data?: { message?: string; error?: string; errors?: Record<string, string> };
        };
        message?: string;
      } | null | undefined;

      // Manejar respuesta HTTP con error
      if (err?.response) {
        statusCode = err.response.status;
        const data = err.response.data;

        // Formato: { message: string }
        if (data?.message) {
          message = data.message;
        }
        // Formato: { error: string }
        else if (data?.error) {
          message = data.error;
        }
        // Formato: { errors: { field: "error" } }
        else if (data?.errors && typeof data.errors === 'object') {
          fieldErrors = data.errors;
          message =
            Object.values(data.errors).join(', ') ||
            'Error de validación en los campos';
        }
        // Formato genérico
        else {
          message = `Error ${statusCode}: ${err.response.statusText || 'Unknown'}`;
        }

        // Errores específicos por código
        if (statusCode === 401) {
          message = 'Tu sesión expiró. Por favor inicia sesión de nuevo';
        } else if (statusCode === 403) {
          message = 'No tienes permisos para realizar esta acción';
        } else if (statusCode === 404) {
          message = 'El recurso no fue encontrado';
        } else if (statusCode === 500) {
          message = 'Error del servidor. Por favor intenta más tarde';
        }
      }
      // Manejar error de red
      else if (err?.message === 'Network Error') {
        message = 'Error de conexión. Verifica tu internet';
      }
      // Manejar mensaje de error simple
      else if (err?.message) {
        message = err.message;
      }

      // Mostrar notificación si es requerido
      if (showToast) {
        showNotification(message, 'error');
      }

      return {
        message,
        statusCode,
        errors: fieldErrors,
      };
    },
    [showNotification]
  );

  return { handleError };
}
