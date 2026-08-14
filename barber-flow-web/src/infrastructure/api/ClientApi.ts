import { IClientRepository } from '@domain/interfaces';
import { Appointment, Client, ClientWithStats } from '@domain/entities';
import { HttpClient } from '../http';
import { CreateClientRequest, UpdateClientRequest } from '@application/dtos/requests';

type ListResponse<T> = T[] | { items: T[] };

function unwrapItems<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items;
}

export class ClientApi implements IClientRepository {
  constructor(private httpClient: HttpClient) {}

  async search(query: string): Promise<Client[]> {
    const response = await this.httpClient.get<ListResponse<Client>>('/api/clients/search', {
      params: { query },
    });
    return unwrapItems(response);
  }

  async getById(id: string): Promise<Client> {
    return this.httpClient.get<Client>(`/api/clients/getById/${id}`);
  }

  async create(request: CreateClientRequest): Promise<Client> {
    return this.httpClient.post<Client>('/api/clients/create', request);
  }

  async update(id: string, request: UpdateClientRequest): Promise<Client> {
    return this.httpClient.put<Client>(`/api/clients/update/${id}`, request);
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/api/clients/delete/${id}`);
  }

  async getAppointmentHistory(id: string): Promise<Appointment[]> {
    const response = await this.httpClient.get<ListResponse<Appointment>>(
      `/api/clients/${id}/appointments/history`
    );
    return unwrapItems(response);
  }

  async getStats(id: string): Promise<ClientWithStats> {
    return this.httpClient.get<ClientWithStats>(`/api/clients/${id}/stats`);
  }
}
