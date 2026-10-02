export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentPaymentMethod = 'cash' | 'sinpeMovil' | 'transfer';

export interface Appointment {
  id?: string;
  clientName: string;
  phone: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: AppointmentStatus;
  serviceName?: string;
  servicePrice?: number;
  paymentMethodUsed?: AppointmentPaymentMethod;
  notes?: string;
  shopId?: string;
  seriesId?: string;
  /** Duración en minutos (15..120, múltiplos de 15). El backend la devuelve siempre (30 si no hay); solo cuenta si el barbero tiene el ajuste encendido. */
  durationMinutes?: number;
}

export interface CreateAppointmentRequest {
  clientName: string;
  phone: string;
  date: string;
  time: string;
  serviceName?: string;
  servicePrice?: number;
  notes?: string;
  /** 15..120, múltiplos de 15. Solo cuenta si el barbero tiene el ajuste de duraciones encendido. */
  durationMinutes?: number;
}

export interface UpdateAppointmentRequest extends CreateAppointmentRequest {
  status?: AppointmentStatus;
  paymentMethodUsed?: AppointmentPaymentMethod;
}

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface RecurrenceConflict {
  date: string;
  time: string;
}

export interface RecurringAppointmentsResult {
  seriesId: string;
  requestedCount: number;
  created: Appointment[];
  conflicts: RecurrenceConflict[];
}
