export interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string;
  paymentMethod?: string;
  active: boolean;
  shopId?: string;
}

export interface ClientStatsResponse extends ClientResponse {
  totalAppointments?: number;
  lastAppointment?: string;
  totalSpent?: number;
}

export interface ClientListResponse {
  items: ClientResponse[];
  total: number;
}
