export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string;
  preferences?: string;
  paymentMethod?: 'Cash' | 'Sinpe Movil' | 'Transfer' | 'None';
  active?: boolean;
}

export interface UpdateClientRequest extends CreateClientRequest {
  id: string;
}

export interface SearchClientRequest {
  query: string;
  limit?: number;
  offset?: number;
}
