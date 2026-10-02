/**
 * Vista de agenda por horas (día).
 * Ver AGENDA_DAY_VIEW_PLAN.md: 1 spot (30 min) por cita, horario 8:00–20:00.
 * El horario es una constante en la v1; los componentes lo reciben por props para poder
 * volverlo un setting de la barbería más adelante.
 */
export const AGENDA = {
  SLOT_MINUTES: 30,
  START_HOUR: 8,
  END_HOUR: 20,
  SLOT_HEIGHT_PX: 52,
  /** Ancho de la columna de etiquetas de hora. */
  GUTTER_PX: 56,
} as const;

/** Clave de localStorage del feature flag (preferencia por dispositivo, apagado por defecto). */
export const AGENDA_FLAG_STORAGE_KEY = 'barber_flow_flag_agenda_day_view';

/**
 * Configuración de la grilla de la agenda. `LEGACY_GRID` es la de siempre (spots de 30 min, cada cita
 * ocupa un spot) y es la que se usa con el ajuste del barbero apagado: la agenda queda idéntica a hoy.
 * `DURATION_GRID` se usa con `enableAppointmentDurations` encendido (AGENDA_DURATION_PLAN.md): spots de
 * 15 min y cada cita ocupa su duración (30 min por defecto).
 */
export interface AgendaGrid {
  slotMinutes: number;
  slotHeightPx: number;
  /** true = el alto/fin de cada cita sale de su duración; false = ocupa exactamente un spot. */
  durationsEnabled: boolean;
}

export const LEGACY_GRID: AgendaGrid = {
  slotMinutes: AGENDA.SLOT_MINUTES,
  slotHeightPx: AGENDA.SLOT_HEIGHT_PX,
  durationsEnabled: false,
};

/** 32 px por spot de 15 min: una cita de 30 min mide 64 px y los puntos de redimensionar se pueden agarrar. */
export const DURATION_GRID: AgendaGrid = {
  slotMinutes: 15,
  slotHeightPx: 32,
  durationsEnabled: true,
};

/** Duración por defecto de una cita (la que se asume cuando no hay una guardada). */
export const DEFAULT_DURATION_MINUTES = 30;
/** Pasos y límites que acepta el backend (múltiplos de 15 entre 15 y 120). */
export const DURATION_STEP_MINUTES = 15;
export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 120;
/** Duraciones que ofrece la UI en la v1 (el backend acepta más). */
export const DURATION_OPTIONS = [15, 30] as const;
