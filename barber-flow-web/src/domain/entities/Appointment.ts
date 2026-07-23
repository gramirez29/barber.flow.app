export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'sinpe_movil' | 'transfer' | 'none';

export interface Appointment {
  id?: string;
  clientName: string;
  phone: string;
  date: string; // ISO date
  time: string; // HH:mm
  status: AppointmentStatus;
  serviceName?: string;
  servicePrice?: number;
  paymentMethodUsed?: PaymentMethod;
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
  paymentMethodUsed?: PaymentMethod;
}
