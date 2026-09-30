import { AppointmentStatus } from '@domain/entities/Appointment';
import { appColors } from './appColors';

/**
 * Color por estado de cita. Mismo mapa que usan AppointmentCard y ClientAppointmentHistory
 * (appColors no tiene tokens success/info): completed verde, confirmed dorado, scheduled azul,
 * cancelled rojo.
 */
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  completed: '#10B981',
  confirmed: appColors.accent,
  scheduled: '#3B82F6',
  cancelled: appColors.error,
};
