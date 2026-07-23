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
  status?: 'scheduled' | 'completed' | 'cancelled';
  paymentMethodUsed?: 'cash' | 'sinpe_movil' | 'transfer' | 'none';
}

export interface MoveAppointmentRequest {
  id: string;
  newDate: string;
  newTime: string;
}
