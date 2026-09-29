import { useCallback, useMemo, useState } from 'react';

export const CLIENT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type ClientPageSize = (typeof CLIENT_PAGE_SIZE_OPTIONS)[number];

/**
 * useClientPagination: paginación local (igual que mobile).
 * El backend devuelve la lista completa filtrada; aquí solo se corta.
 */
export function useClientPagination<T>(items: T[]) {
  const [requestedPage, setRequestedPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<ClientPageSize>(10);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Ajusta si la página queda fuera de rango (p. ej. al eliminar el último de la última página)
  const page = Math.min(requestedPage, totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  const setPage = useCallback(
    (next: number) => setRequestedPage(Math.min(Math.max(1, next), totalPages)),
    [totalPages]
  );

  const setPageSize = useCallback((size: ClientPageSize) => {
    setPageSizeState(size);
    setRequestedPage(1);
  }, []);

  const resetPage = useCallback(() => setRequestedPage(1), []);

  return { page, pageSize, totalPages, pageItems, setPage, setPageSize, resetPage };
}
