/**
 * "Actualizar" completo de la app: sustituye al pull-to-refresh (desactivado en `index.css`).
 *
 * Antes de recargar elimina, si existen, los service workers y las cachés del navegador (Cache Storage),
 * para que una app instalada o abierta mucho tiempo cargue la versión más reciente en vez de una copia
 * guardada. La sesión (localStorage) NO se toca: el usuario sigue logueado después de recargar.
 * Es "best effort": si el navegador no soporta alguna API, igual se recarga la página.
 */
export async function forceRefresh(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Sin permiso o sin soporte: se recarga igual.
  }
  window.location.reload();
}
