import { Appointment, AppointmentStatus } from '@domain/entities/Appointment';
import { AGENDA } from '@shared/constants/agenda';

/**
 * Lógica PURA de la vista de agenda por horas (sin React), para poder probarla con vitest.
 * Todas las horas se manejan en "minutos desde medianoche".
 */

export interface AgendaRange {
  startMinutes: number;
  endMinutes: number;
}

export interface LaidOutAppointment {
  appointment: Appointment;
  startMinutes: number;
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

/**
 * Rango visible: por defecto startHour–endHour, pero se amplía (a horas completas) si existe una
 * cita fuera de ese rango, para que nunca quede una cita oculta.
 */
export const getVisibleRange = (
  appointments: Pick<Appointment, 'time'>[],
  startHour: number = AGENDA.START_HOUR,
  endHour: number = AGENDA.END_HOUR
): AgendaRange => {
  let start = startHour * 60;
  let end = endHour * 60;

  for (const appointment of appointments) {
    const minutes = timeToMinutes(appointment.time);
    if (Number.isNaN(minutes)) continue;
    start = Math.min(start, Math.floor(minutes / 60) * 60);
    end = Math.max(end, Math.ceil((minutes + AGENDA.SLOT_MINUTES) / 60) * 60);
  }

  return { startMinutes: Math.max(0, start), endMinutes: Math.min(24 * 60, end) };
};

/** Inicio (en minutos) de cada spot de 30 min dentro del rango. */
export const getSlotStarts = (range: AgendaRange): number[] => {
  const slots: number[] = [];
  for (let minutes = range.startMinutes; minutes < range.endMinutes; minutes += AGENDA.SLOT_MINUTES) {
    slots.push(minutes);
  }
  return slots;
};

/** Distancia vertical (px) desde el inicio del rango hasta `minutes`. */
export const minutesToOffset = (minutes: number, range: AgendaRange): number =>
  ((minutes - range.startMinutes) / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_HEIGHT_PX;

/** Alto total (px) de la grilla. */
export const getGridHeight = (range: AgendaRange): number =>
  ((range.endMinutes - range.startMinutes) / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_HEIGHT_PX;

/** Ajusta unos minutos al inicio del spot de 30 min que los contiene (:00 o :30). */
export const snapToSlot = (minutes: number): number =>
  Math.floor(minutes / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_MINUTES;

/** Etiqueta de hora en punto: 8 -> "8 AM", 12 -> "12 PM", 20 -> "8 PM". */
export const formatHourLabel = (minutes: number): string => {
  const hour24 = Math.floor(minutes / 60) % 24;
  const suffix = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${suffix}`;
};

/**
 * Reparte las citas en carriles cuando se traslapan visualmente (p. ej. una a las 11:00 y otra a las
 * 11:10, cada una ocupa un spot de 30 min): quedan lado a lado en vez de encimadas. Un traslape
 * visual NO es un choque (el choque real es solo la misma fecha+hora exacta, lo valida el backend).
 */
export const layoutLanes = (appointments: Appointment[]): LaidOutAppointment[] => {
  const items = appointments
    .map((appointment) => ({ appointment, start: timeToMinutes(appointment.time) }))
    .filter((item) => !Number.isNaN(item.start))
    .sort((a, b) => a.start - b.start);

  const result: LaidOutAppointment[] = [];
  let cluster: { appointment: Appointment; start: number; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const laneCount = Math.max(1, laneEnds.length);
    cluster.forEach((entry) =>
      result.push({ appointment: entry.appointment, startMinutes: entry.start, lane: entry.lane, laneCount })
    );
    cluster = [];
    laneEnds = [];
  };

  for (const item of items) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.start + AGENDA.SLOT_MINUTES;
    cluster.push({ appointment: item.appointment, start: item.start, lane });
    clusterEnd = Math.max(clusterEnd, item.start + AGENDA.SLOT_MINUTES);
  }
  if (cluster.length > 0) flush();

  return result;
};

const MOVABLE_STATUSES: AppointmentStatus[] = ['scheduled', 'confirmed'];

/** Solo las citas Agendadas o Confirmadas se pueden arrastrar (igual que la card "Mover cita"). */
export const isAgendaMovable = (status: AppointmentStatus): boolean => MOVABLE_STATUSES.includes(status);
