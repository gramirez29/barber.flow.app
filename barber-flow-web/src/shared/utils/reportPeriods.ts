import { addDays, addMonths, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

/** Periodos de la pantalla de Reportes. El diario ya existía; semana y mes llegan del backend. */
export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

const DATE_KEY_FORMAT = 'yyyy-MM-dd';
const MONTH_KEY_FORMAT = 'yyyy-MM';

/** "yyyy-MM-dd" -> Date a medianoche LOCAL (new Date('2026-11-18') sería UTC y puede caer en el día anterior). */
export const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const toDateKey = (date: Date): string => format(date, DATE_KEY_FORMAT);

/** "2026-11-18" -> "2026-11" */
export const toMonthKey = (dateKey: string): string => dateKey.slice(0, 7);

/** Semana de domingo a sábado que contiene la fecha (igual que el backend). */
export const getWeekRange = (dateKey: string): { from: string; to: string } => {
  const start = startOfWeek(parseDateKey(dateKey), { weekStartsOn: 0 });
  return { from: toDateKey(start), to: toDateKey(addDays(start, 6)) };
};

/** Mueve la fecha ancla un periodo hacia atrás (-1) o adelante (+1). El mes conserva el día cuando existe. */
export const shiftAnchor = (period: ReportPeriod, dateKey: string, direction: -1 | 1): string => {
  const date = parseDateKey(dateKey);
  switch (period) {
    case 'weekly':
      return toDateKey(addDays(date, 7 * direction));
    case 'monthly':
      return toDateKey(addMonths(date, direction));
    default:
      return toDateKey(addDays(date, direction));
  }
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "dom 15 – sáb 21 nov" (o "dom 29 nov – sáb 5 dic" si cruza de mes). */
export const formatWeekLabel = (dateKey: string): string => {
  const { from, to } = getWeekRange(dateKey);
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  const sameMonth = start.getMonth() === end.getMonth();
  const left = sameMonth ? format(start, 'EEE d', { locale: es }) : format(start, 'EEE d MMM', { locale: es });
  const right = format(end, 'EEE d MMM', { locale: es });
  return `${left} – ${right}`.replace(/\./g, '');
};

/** "2026-11-18" -> "Noviembre de 2026" */
export const formatMonthLabel = (dateKey: string): string =>
  capitalize(format(parseDateKey(dateKey), "LLLL 'de' yyyy", { locale: es }));

/** "2026-11-16" -> "lun 16 nov" */
export const formatDayLabel = (dateKey: string): string =>
  format(parseDateKey(dateKey), 'EEE d MMM', { locale: es }).replace(/\./g, '');

/** Valor para un `<input type="month">`. */
export const toMonthInputValue = (dateKey: string): string => format(parseDateKey(dateKey), MONTH_KEY_FORMAT);

/** `<input type="month">` ("2026-11") -> fecha ancla (primer día del mes) para el estado. */
export const fromMonthInputValue = (monthValue: string): string => `${monthValue}-01`;

/** Textos del encabezado y de las tarjetas según el periodo. */
export const PERIOD_COPY: Record<
  ReportPeriod,
  { heroTitle: string; todayLabel: string; ofPeriod: string; profitTitle: string; selectorLabel: string }
> = {
  daily: {
    heroTitle: 'Reporte de cierre diario',
    todayLabel: 'Hoy',
    ofPeriod: 'del día',
    profitTitle: 'Ganancias del día',
    selectorLabel: 'Día',
  },
  weekly: {
    heroTitle: 'Reporte de cierre semanal',
    todayLabel: 'Esta semana',
    ofPeriod: 'de la semana',
    profitTitle: 'Ganancias de la semana',
    selectorLabel: 'Semana',
  },
  monthly: {
    heroTitle: 'Reporte de cierre mensual',
    todayLabel: 'Este mes',
    ofPeriod: 'del mes',
    profitTitle: 'Ganancias del mes',
    selectorLabel: 'Mes',
  },
};

export const REPORT_PERIODS: ReportPeriod[] = ['daily', 'weekly', 'monthly'];
