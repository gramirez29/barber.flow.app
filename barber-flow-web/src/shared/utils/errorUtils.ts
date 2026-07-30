/**
 * Extrae un mensaje legible de un error de tipo desconocido.
 * AxiosHttpClient rechaza con `error.response?.data || error.message`,
 * por lo que el valor puede ser un string, un objeto `{ message }`, o un Error real.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error) return error;
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
