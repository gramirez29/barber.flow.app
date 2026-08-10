import { useState, useCallback, useMemo } from 'react';
import { addDays, format, subDays } from 'date-fns';
import { DailyReport } from '@domain/entities';
import { useNotification } from '@presentation/context/NotificationContext';
import { ReportApi } from '@infrastructure/api/ReportApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';

const DATE_FORMAT = 'yyyy-MM-dd';
const todayKey = () => format(new Date(), DATE_FORMAT);

/**
 * useReports: Hook para manejo del reporte de cierre diario
 */
export function useReports() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const reportApi = useMemo(() => new ReportApi(new AxiosHttpClient()), []);

  const fetchDailyReport = useCallback(
    async (date: string) => {
      setIsLoadingReports(true);
      setSelectedDate(date);
      try {
        const data = await reportApi.getDailyReport(date);
        setReport(data);
        setReportError(null);
      } catch (error) {
        const message = getErrorMessage(error, 'Error al cargar reporte');
        setReport(null);
        setReportError(message);
        showNotification(message, 'error');
      } finally {
        setIsLoadingReports(false);
      }
    },
    [reportApi, showNotification]
  );

  const previousDay = useCallback(async () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = subDays(new Date(year, month - 1, day), 1);
    await fetchDailyReport(format(date, DATE_FORMAT));
  }, [selectedDate, fetchDailyReport]);

  const nextDay = useCallback(async () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = addDays(new Date(year, month - 1, day), 1);
    await fetchDailyReport(format(date, DATE_FORMAT));
  }, [selectedDate, fetchDailyReport]);

  const goToToday = useCallback(async () => {
    await fetchDailyReport(todayKey());
  }, [fetchDailyReport]);

  return {
    report,
    selectedDate,
    isLoadingReports,
    reportError,

    fetchDailyReport,
    previousDay,
    nextDay,
    goToToday,

    setSelectedDate,
  };
}
