export interface AppointmentResponse {
  id: string;
  clientName: string;
  phone: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  serviceName?: string;
  servicePrice?: number;
  paymentMethodUsed?: string;
  notes?: string;
  shopId?: string;
}

export interface AppointmentListResponse {
  items: AppointmentResponse[];
  total: number;
}
