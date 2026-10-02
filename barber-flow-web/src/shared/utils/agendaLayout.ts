import { Appointment, AppointmentStatus } from '@domain/entities/Appointment';
import {
  AGENDA,
  AgendaGrid,
  DEFAULT_DURATION_MINUTES,
  LEGACY_GRID,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
} from '@shared/constants/agenda';

/**
 * Lógica PURA de la vista de agenda por horas (sin React), para poder probarla con vitest.
 * Todas las horas se manejan en "minutos desde medianoche". Casi todas las funciones reciben la grilla
 * (`AgendaGrid`): con `LEGACY_GRID` (por defecto) el comportamiento es el de siempre.
 */

export interface AgendaRange {
  startMinutes: number;
  endMinutes: number;
}

export interface LaidOutAppointment {
  appointment: Appointment;
  startMinutes: number;
  /** Duración que ocupa el bloque, en minutos (un spot con la grilla de siempre). */
  durationMinutes: number;
  /** Carril (0..laneCount-1) para citas que se traslapan visualmente. */
  lane: number;
  laneCount: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "HH:mm" -> minutos desde medianoche (NaN si el formato es inválido). */
export const timeToMinutes = (time: string): number => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time?.trim() ?? '');
  if (!match) return NaN;
  return Number(match[1]) * 60 + Number(match[2]);
};

/** minutos desde medianoche -> "HH:mm". */
export const minutesToTime = (minutes: number): string => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Minutos que ocupa una cita: su duración con la grilla de duraciones; un spot con la de siempre. */
export const getAppointmentDuration = (
  appointment: Pick<Appointment, 'durationMinutes'>,
  grid: AgendaGrid = LEGACY_GRID
): number => (grid.durationsEnabled ? appointment.durationMinutes ?? DEFAULT_DURATION_MINUTES : grid.slotMinutes);

/**
 * Rango visible: por defecto startHour–endHour, pero se amplía (a horas completas) si existe una
 * cita fuera de ese rango, para que nunca quede una cita oculta.
 */
export const getVisibleRange = (
  appointments: Pick<Appointment, 'time' | 'durationMinutes'>[],
  startHour: number = AGENDA.START_HOUR,
  endHour: number = AGENDA.END_HOUR,
  grid: AgendaGrid = LEGACY_GRID
): AgendaRange => {
  let start = startHour * 60;
  let end = endHour * 60;

  for (const appointment of appointments) {
    const minutes = timeToMinutes(appointment.time);
    if (Number.isNaN(minutes)) continue;
    start = Math.min(start, Math.floor(minutes / 60) * 60);
    end = Math.max(end, Math.ceil((minutes + getAppointmentDuration(appointment, grid)) / 60) * 60);
  }

  return { startMinutes: Math.max(0, start), endMinutes: Math.min(24 * 60, end) };
};

/** Inicio (en minutos) de cada spot dentro del rango. */
export const getSlotStarts = (range: AgendaRange, grid: AgendaGrid = LEGACY_GRID): number[] => {
  const slots: number[] = [];
  for (let minutes = range.startMinutes; minutes < range.endMinutes; minutes += grid.slotMinutes) {
    slots.push(minutes);
  }
  return slots;
};

/** Distancia vertical (px) desde el inicio del rango hasta `minutes`. */
export const minutesToOffset = (minutes: number, range: AgendaRange, grid: AgendaGrid = LEGACY_GRID): number =>
  ((minutes - range.startMinutes) / grid.slotMinutes) * grid.slotHeightPx;

/** Alto (px) de un bloque que dura `durationMinutes`. */
export const durationToHeight = (durationMinutes: number, grid: AgendaGrid = LEGACY_GRID): number =>
  (durationMinutes / grid.slotMinutes) * grid.slotHeightPx;

/** Alto total (px) de la grilla. */
export const getGridHeight = (range: AgendaRange, grid: AgendaGrid = LEGACY_GRID): number =>
  durationToHeight(range.endMinutes - range.startMinutes, grid);

/** Ajusta unos minutos al inicio del spot que los contiene. */
export const snapToSlot = (minutes: number, grid: AgendaGrid = LEGACY_GRID): number =>
  Math.floor(minutes / grid.slotMinutes) * grid.slotMinutes;

/** Etiqueta de hora en punto: 8 -> "8 AM", 12 -> "12 PM", 20 -> "8 PM". */
export const formatHourLabel = (minutes: number): string => {
  const hour24 = Math.floor(minutes / 60) % 24;
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${suffix}`;
};

/**
 * Reparte las citas en carriles cuando se traslapan visualmente (p. ej. una a las 11:00 y otra a las
 * 11:10): quedan lado a lado en vez de encimadas. Con la grilla de siempre cada cita ocupa un spot
 * (y un traslape visual NO es un choque: ahí el choque es la misma hora exacta, lo valida el backend);
 * con duraciones, el fin de cada cita es inicio + duración.
 */
export const layoutLanes = (appointments: Appointment[], grid: AgendaGrid = LEGACY_GRID): LaidOutAppointment[] => {
  const items = appointments
    .map((appointment) => ({ appointment, start: timeToMinutes(appointment.time) }))
    .filter((item) => !Number.isNaN(item.start))
    .sort((a, b) => a.start - b.start);

  const result: LaidOutAppointment[] = [];
  let cluster: { appointment: Appointment; start: number; duration: number; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const laneCount = Math.max(1, laneEnds.length);
    cluster.forEach((entry) =>
      result.push({
        appointment: entry.appointment,
        startMinutes: entry.start,
        durationMinutes: entry.duration,
        lane: entry.lane,
        laneCount,
      })
    );
    cluster = [];
    laneEnds = [];
  };

  for (const item of items) {
    const duration = getAppointmentDuration(item.appointment, grid);
    if (cluster.length > 0 && item.start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.start + duration;
    cluster.push({ appointment: item.appointment, start: item.start, duration, lane });
    clusterEnd = Math.max(clusterEnd, item.start + duration);
  }
  if (cluster.length > 0) flush();

  return result;
};

const MOVABLE_STATUSES: AppointmentStatus[] = ['scheduled', 'confirmed'];

/** Solo las citas Agendadas o Confirmadas se pueden arrastrar o redimensionar (igual que "Mover cita"). */
export const isAgendaMovable = (status: AppointmentStatus): boolean => MOVABLE_STATUSES.includes(status);

/** Rango [inicio, fin) de otra cita, usado para limitar el estiramiento de la que se redimensiona. */
export interface BusyRange {
  startMinutes: number;
  endMinutes: number;
}

/** Rangos ocupados de las citas activas (no canceladas), excluyendo la cita con `excludeId`. */
export const getBusyRanges = (
  appointments: Appointment[],
  excludeId: string | undefined,
  grid: AgendaGrid = LEGACY_GRID
): BusyRange[] =>
  appointments
    .filter((a) => a.id !== excludeId && a.status !== 'cancelled')
    .map((a) => ({ start: timeToMinutes(a.time), duration: getAppointmentDuration(a, grid) }))
    .filter((r) => !Number.isNaN(r.start))
    .map((r) => ({ startMinutes: r.start, endMinutes: r.start + r.duration }));

export type ResizeHandle = 'top' | 'bottom';

export interface ResizeResult {
  startMinutes: number;
  durationMinutes: number;
}

/**
 * Resultado de arrastrar un punto/borde de una cita `deltaPx` píxeles. El de abajo cambia el fin; el de
 * arriba cambia el inicio (el fin queda fijo). Se ajusta a los spots, con mínimo 15 min (y máximo 120),
 * sin salirse del rango visible ni invadir a la cita vecina.
 */
export const getResizeResult = (params: {
  startMinutes: number;
  durationMinutes: number;
  handle: ResizeHandle;
  deltaPx: number;
  range: AgendaRange;
  busy: BusyRange[];
  grid?: AgendaGrid;
}): ResizeResult => {
  const { startMinutes, durationMinutes, handle, deltaPx, range, busy, grid = LEGACY_GRID } = params;
  const end = startMinutes + durationMinutes;
  const deltaMinutes = Math.round(deltaPx / grid.slotHeightPx) * grid.slotMinutes;

  if (handle === 'bottom') {
    // No pasa de la siguiente cita (la más cercana que empieza desde el fin actual), ni del fin del rango.
    const nextStart = Math.min(range.endMinutes, ...busy.filter((b) => b.startMinutes >= end).map((b) => b.startMinutes));
    const maxEnd = Math.min(nextStart, startMinutes + MAX_DURATION_MINUTES);
    const newEnd = Math.min(Math.max(end + deltaMinutes, startMinutes + MIN_DURATION_MINUTES), maxEnd);
    return { startMinutes, durationMinutes: Math.max(MIN_DURATION_MINUTES, newEnd - startMinutes) };
  }

  // Punto superior: el inicio cambia, el fin se queda. No baja de la cita anterior ni del inicio del rango.
  const prevEnd = Math.max(range.startMinutes, ...busy.filter((b) => b.endMinutes <= startMinutes).map((b) => b.endMinutes));
  const minStart = Math.max(prevEnd, end - MAX_DURATION_MINUTES);
  const newStart = Math.max(Math.min(startMinutes + deltaMinutes, end - MIN_DURATION_MINUTES), minStart);
  return { startMinutes: newStart, durationMinutes: Math.max(MIN_DURATION_MINUTES, end - newStart) };
};

/**
 * Cuántos minutos hay libres desde `startMinutes` hasta la siguiente cita (tope `max`). Sirve para decidir la
 * duración de una cita nueva creada tocando un spot: si solo quedan 15 min libres se crea de 15 (decisión D4).
 * Devuelve 0 si el spot ya está ocupado.
 */
export const getFreeMinutesFrom = (
  startMinutes: number,
  busy: BusyRange[],
  max: number = DEFAULT_DURATION_MINUTES
): number => {
  if (busy.some((b) => b.startMinutes <= startMinutes && startMinutes < b.endMinutes)) return 0;
  const nextStart = Math.min(Infinity, ...busy.filter((b) => b.startMinutes > startMinutes).map((b) => b.startMinutes));
  return Math.min(max, nextStart - startMinutes);
};

/** Duración con la que se precarga una cita nueva en un spot: 30 si caben, 15 si solo quedan 15 libres. */
export const getDefaultDurationForSlot = (startMinutes: number, busy: BusyRange[]): number => {
  const free = getFreeMinutesFrom(startMinutes, busy, DEFAULT_DURATION_MINUTES);
  return free >= DEFAULT_DURATION_MINUTES ? DEFAULT_DURATION_MINUTES : Math.max(MIN_DURATION_MINUTES, free);
};

/** "11:00 – 11:30" para la etiqueta en vivo al redimensionar. */
export const formatTimeRange = (startMinutes: number, durationMinutes: number): string =>
  `${minutesToTime(startMinutes)} – ${minutesToTime(startMinutes + durationMinutes)}`;
