import { afterEach, describe, expect, it, vi } from 'vitest';
import { forceRefresh } from './forceRefresh';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('forceRefresh', () => {
  it('elimina service workers y cachés y luego recarga la página', async () => {
    const order: string[] = [];
    const unregister = vi.fn(async () => {
      order.push('unregister');
      return true;
    });
    const deleteCache = vi.fn(async () => {
      order.push('deleteCache');
      return true;
    });
    const reload = vi.fn(() => order.push('reload'));
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => [{ unregister }, { unregister }] } });
    vi.stubGlobal('caches', { keys: async () => ['a', 'b', 'c'], delete: deleteCache });
    vi.stubGlobal('window', { location: { reload } });

    await forceRefresh();

    expect(unregister).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenCalledTimes(3);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(order[order.length - 1]).toBe('reload');
  });

  it('recarga igual si el navegador no soporta service workers ni cachés', async () => {
    const reload = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('caches', undefined);
    vi.stubGlobal('window', { location: { reload } });

    await forceRefresh();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('recarga igual si limpiar las cachés falla', async () => {
    const reload = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { getRegistrations: async () => { throw new Error('denegado'); } } });
    vi.stubGlobal('caches', undefined);
    vi.stubGlobal('window', { location: { reload } });

    await forceRefresh();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
