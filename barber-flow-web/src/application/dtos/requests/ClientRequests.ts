export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  birthday?: string;
  paymentMethod?: 'cash' | 'sinpe_movil' | 'transfer' | 'none';
}

export interface UpdateClientRequest extends CreateClientRequest {
  id: string;
  active?: boolean;
}

export interface SearchClientRequest {
  query: string;
  limit?: number;
  offset?: number;
}
