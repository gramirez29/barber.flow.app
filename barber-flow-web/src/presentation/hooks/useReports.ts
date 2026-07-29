import { useState, useCallback, useMemo } from 'react';
import { DailyReport, DailyReportStats } from '@domain/entities';
import { useNotification } from '@presentation/context/NotificationContext';
import { ReportApi } from '@infrastructure/api/ReportApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';

/**
 * useReports: Hook para manejo de reportes
 *
 * Proporciona:
 * - Reportes diarios con estadísticas
 * - Búsqueda por rango de fechas
 * - Cálculos de ingresos y gastos
 *
 * Ejemplo:
 * ```tsx
 * const { report, stats, isLoading, fetchDailyReport } = useReports();
 *
 * useEffect(() => {
 *   fetchDailyReport('2024-12-25');
 * }, []);
 * ```
 */
export function useReports() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [stats, setStats] = useState<DailyReportStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const { showNotification } = useNotification();

  // Inyectar ReportApi
  const reportApi = useMemo(() => new ReportApi(new AxiosHttpClient()), []);

  /**
   * Obtener reporte diario completo
   */
  const fetchDailyReport = useCallback(
    async (date: string) => {
      setIsLoadingReports(true);
      setSelectedDate(date);
      try {
        const data = await reportApi.getDailyReport(date);
        setReport(data);
        if (data.stats) {
          setStats(data.stats);
        }
        showNotification('Reporte cargado correctamente', 'success');
      } catch (error) {
        const message = getErrorMessage(error, 'Error al cargar reporte');
        showNotification(message, 'error');
      } finally {
        setIsLoadingReports(false);
      }
    },
    [reportApi, showNotification]
  );

  /**
   * Obtener solo estadísticas del día
   */
  const fetchDailyStats = useCallback(
    async (date: string) => {
      try {
        const data = await reportApi.getStats(date);
        setStats(data);
        showNotification('Estadísticas cargadas', 'success');
      } catch (error) {
        const message = getErrorMessage(error, 'Error al cargar estadísticas');
        showNotification(message, 'error');
      }
    },
    [reportApi, showNotification]
  );

  /**
   * Navegar al día anterior
   */
  const previousDay = useCallback(async () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split('T')[0];
    await fetchDailyReport(newDate);
  }, [selectedDate, fetchDailyReport]);

  /**
   * Navegar al día siguiente
   */
  const nextDay = useCallback(async () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split('T')[0];
    await fetchDailyReport(newDate);
  }, [selectedDate, fetchDailyReport]);

  /**
   * Ir a hoy
   */
  const goToToday = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    await fetchDailyReport(today);
  }, [fetchDailyReport]);

  return {
    // State
    report,
    stats,
    selectedDate,
    isLoadingReports,

    // Methods
    fetchDailyReport,
    fetchDailyStats,
    previousDay,
    nextDay,
    goToToday,

    // Setters
    setSelectedDate,
  };
}
