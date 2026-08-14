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
}

export interface CreateAppointmentRequest {
  clientName: string;
  phone: string;
  date: string;
  time: string;
  serviceName?: string;
  servicePrice?: number;
  notes?: string;
}

export interface UpdateAppointmentRequest extends CreateAppointmentRequest {
  status?: AppointmentStatus;
  paymentMethodUsed?: AppointmentPaymentMethod;
}
