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
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  paymentMethodUsed?: 'cash' | 'sinpeMovil' | 'transfer';
}

export interface MoveAppointmentRequest {
  id: string;
  newDate: string;
  newTime: string;
}

/** Cambia la duración de una cita; `newTime` solo cuando también cambia el inicio (punto superior). */
export interface ResizeAppointmentRequest {
  id: string;
  durationMinutes: number;
  newTime?: string;
}
