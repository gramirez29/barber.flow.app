import type { PaymentMethod } from './Appointment';

export interface Client {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string; // ISO date (YYYY-MM-DD)
  paymentMethod?: PaymentMethod;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  shopId?: string;
}

export interface ClientWithStats extends Client {
  totalAppointments?: number;
  lastAppointment?: string; // ISO date
  totalSpent?: number;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string;
  paymentMethod?: PaymentMethod;
}

export interface UpdateClientRequest extends CreateClientRequest {
  active?: boolean;
}

export interface ClientResponse extends Client {
  id: string;
}
