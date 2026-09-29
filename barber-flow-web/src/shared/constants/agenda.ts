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
