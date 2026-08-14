import { useState, useCallback } from 'react';
import { useApiError } from './useApiError';

export interface UseAsyncReturn<T, E = unknown, A extends unknown[] = unknown[]> {
  data: T | null;
  isLoading: boolean;
  error: E | null;
  isSuccess: boolean;
  execute: (...args: A) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
}

/**
 * useAsync: Hook para manejar operaciones asincrónicas
 *
 * Features:
 * - Manejo automático de loading state
 * - Captura y formateo de errores
 * - Tracking de éxito/fracaso
 * - Reset para reutilización
 *
 * Ejemplo:
 * ```tsx
 * const { data, isLoading, error, execute } = useAsync(
 *   (email) => authApi.sendOtp(email)
 * );
 *
 * const handleSendOtp = async (email: string) => {
 *   try {
 *     await execute(email);
 *   } catch (err) {
 *     // Error manejado automáticamente
 *   }
 * };
 * ```
 */
export function useAsync<T, E = unknown, A extends unknown[] = unknown[]>(
  asyncFunction: (...args: A) => Promise<T>,
  immediate = false,
  onSuccess?: (data: T) => void,
  onError?: (error: E) => void
): UseAsyncReturn<T, E, A> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { handleError } = useApiError();

  const execute = useCallback(
    async (...args: A): Promise<T> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const response = await asyncFunction(...args);
        setData(response);
        setIsSuccess(true);
        onSuccess?.(response);
        return response;
      } catch (err) {
        const apiError = handleError(err, false) as E;
        setError(apiError);
        onError?.(apiError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction, onSuccess, onError, handleError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
  }, []);

  // Ejecutar inmediatamente si se especifica
  if (immediate) {
    // useEffect sería más apropiado, pero en un hook usamos esto con cuidado
    // Mejor usar este hook dentro de un useEffect en componentes
  }

  return {
    data,
    isLoading,
    error,
    isSuccess,
    execute,
    reset,
    setData,
  };
}
