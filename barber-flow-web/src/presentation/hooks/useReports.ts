import { useState, useCallback, useMemo, useRef } from 'react';
import { DailyReport, PeriodReport } from '@domain/entities';
import { useNotification } from '@presentation/context/NotificationContext';
import { ReportApi } from '@infrastructure/api/ReportApi';
import { AxiosHttpClient } from '@infrastructure/http/AxiosHttpClient';
import { getErrorMessage } from '@shared/utils/errorUtils';
import { ReportPeriod, shiftAnchor, toDateKey, toMonthKey } from '@shared/utils/reportPeriods';

const todayKey = () => toDateKey(new Date());

/**
 * useReports: reportes de cierre. El diario (`report`) y los periodos semanal/mensual (`periodReport`)
 * comparten la fecha seleccionada (`selectedDate`, yyyy-MM-dd), que hace de ancla: el día mismo, cualquier
 * día de la semana domingo-sábado, o cualquier día del mes.
 */
export function useReports() {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [periodReport, setPeriodReport] = useState<PeriodReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const reportApi = useMemo(() => new ReportApi(new AxiosHttpClient()), []);

  // Si el usuario cambia de periodo o de fecha mientras una petición sigue en vuelo, solo vale la última.
  const latestRequest = useRef(0);

  const fetchReport = useCallback(
    async (date: string, nextPeriod: ReportPeriod = 'daily') => {
      const requestId = ++latestRequest.current;
      setIsLoadingReports(true);
      setPeriod(nextPeriod);
      setSelectedDate(date);
      try {
        if (nextPeriod === 'daily') {
          const data = await reportApi.getDailyReport(date);
          if (requestId !== latestRequest.current) return;
          setReport(data);
        } else {
          const data =
            nextPeriod === 'weekly'
              ? await reportApi.getWeeklyReport(date)
              : await reportApi.getMonthlyReport(toMonthKey(date));
          if (requestId !== latestRequest.current) return;
          setPeriodReport(data);
        }
        setReportError(null);
      } catch (error) {
        if (requestId !== latestRequest.current) return;
        const message = getErrorMessage(error, 'Error al cargar reporte');
        if (nextPeriod === 'daily') {
          setReport(null);
        } else {
          setPeriodReport(null);
        }
        setReportError(message);
        showNotification(message, 'error');
      } finally {
        if (requestId === latestRequest.current) {
          setIsLoadingReports(false);
        }
      }
    },
    [reportApi, showNotification]
  );

  /** Compatibilidad: reporte diario de una fecha. */
  const fetchDailyReport = useCallback((date: string) => fetchReport(date, 'daily'), [fetchReport]);

  const changePeriod = useCallback(
    (nextPeriod: ReportPeriod) => fetchReport(selectedDate, nextPeriod),
    [fetchReport, selectedDate]
  );

  const goToToday = useCallback(
    () => fetchReport(todayKey(), period),
    [fetchReport, period]
  );

  const goToPrevious = useCallback(
    () => fetchReport(shiftAnchor(period, selectedDate, -1), period),
    [fetchReport, period, selectedDate]
  );

  const goToNext = useCallback(
    () => fetchReport(shiftAnchor(period, selectedDate, 1), period),
    [fetchReport, period, selectedDate]
  );

  return {
    period,
    report,
    periodReport,
    selectedDate,
    isLoadingReports,
    reportError,

    fetchReport,
    fetchDailyReport,
    changePeriod,
    goToToday,
    goToPrevious,
    goToNext,

    setSelectedDate,
  };
}
