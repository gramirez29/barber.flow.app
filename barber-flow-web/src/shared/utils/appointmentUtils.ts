/**
 * Appointment Utilities
 * Funciones utilitarias para manejo de citas
 */
import { Appointment } from '@domain/entities';

/**
 * Convierte un string de tiempo HH:mm a minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a formato HH:mm
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Calcula la hora de finalización de una cita
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
}

/**
 * Verifica si dos citas se superponen
 */
export function appointmentsOverlap(
  apt1Start: string,
  apt1Duration: number,
  apt2Start: string,
  apt2Duration: number
): boolean {
  const apt1End = calculateEndTime(apt1Start, apt1Duration);
  const apt2End = calculateEndTime(apt2Start, apt2Duration);

  const apt1StartMin = timeToMinutes(apt1Start);
  const apt1EndMin = timeToMinutes(apt1End);
  const apt2StartMin = timeToMinutes(apt2Start);
  const apt2EndMin = timeToMinutes(apt2End);

  return apt1StartMin < apt2EndMin && apt2StartMin < apt1EndMin;
}

/**
 * Verifica si una hora está dentro del horario de trabajo
 */
export function isWithinWorkingHours(
  time: string,
  workStart: string = '09:00',
  workEnd: string = '17:00'
): boolean {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(workStart);
  const endMin = timeToMinutes(workEnd);

  return timeMin >= startMin && timeMin < endMin;
}

/**
 * Calcula slots de tiempo disponibles en un día
 */
export function getAvailableTimeSlots(
  existingAppointments: Array<{ time: string; duration?: number }>,
  slotDuration: number = 30,
  workStart: string = '09:00',
  workEnd: string = '17:00'
): string[] {
  const slots: string[] = [];
  const workStartMin = timeToMinutes(workStart);
  const workEndMin = timeToMinutes(workEnd);

  // Generar todos los slots posibles
  for (let time = workStartMin; time < workEndMin; time += slotDuration) {
    const slotTime = minutesToTime(time);
    
    // Verificar si el slot está disponible
    const isAvailable = !existingAppointments.some((apt) => {
      const aptDuration = apt.duration || slotDuration;
      return appointmentsOverlap(slotTime, slotDuration, apt.time, aptDuration);
    });

    if (isAvailable) {
      slots.push(slotTime);
    }
  }

  return slots;
}

/**
 * Ordena citas por fecha y hora
 */
export function sortAppointmentsByDateTime(
  appointments: Appointment[]
): Appointment[] {
  return [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Agrupa citas por fecha
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Record<string, Appointment[]> {
  return appointments.reduce((acc, apt) => {
    if (!acc[apt.date]) {
      acc[apt.date] = [];
    }
    acc[apt.date].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);
}

/**
 * Obtiene las citas del día actual
 */
export function getTodayAppointments(appointments: Appointment[]): Appointment[] {
  const today = new Date().toISOString().split('T')[0];
  return appointments.filter((apt) => apt.date === today);
}

/**
 * Obtiene las citas de los próximos N días
 */
export function getUpcomingAppointments(
  appointments: Appointment[],
  days: number = 7
): Appointment[] {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

  return appointments.filter((apt) => {
    const aptDate = new Date(apt.date);
    return aptDate >= today && aptDate <= futureDate;
  });
}

/**
 * Verifica si una cita puede ser cancelada
 * (No puede cancelarse si es en menos de X minutos)
 */
export function canCancelAppointment(
  appointmentDate: string,
  appointmentTime: string,
  minimumAdvanceMinutes: number = 60
): boolean {
  const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
  const now = new Date();
  const diffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

  return diffMinutes >= minimumAdvanceMinutes;
}

/**
 * Calcula si una cita fue reciente (completada hoy o ayer)
 */
export function isRecentAppointment(
  appointmentDate: string,
  daysBack: number = 1
): boolean {
  const today = new Date();
  const appointmentDateTime = new Date(appointmentDate);
  const diffDays = Math.floor(
    (today.getTime() - appointmentDateTime.getTime()) / (24 * 60 * 60 * 1000)
  );

  return diffDays >= 0 && diffDays <= daysBack;
}
