import { IClientRepository } from '@domain/interfaces';
import { Client, ClientWithStats } from '@domain/entities';
import { HttpClient } from '../http';
import { CreateClientRequest, UpdateClientRequest } from '@application/dtos/requests';

export class ClientApi implements IClientRepository {
  constructor(private httpClient: HttpClient) {}

  async search(query: string): Promise<Client[]> {
    const response = await this.httpClient.get<any>('/api/clients/search', {
      params: { query },
    });
    return response.items || response;
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

  async getAppointmentHistory(id: string): Promise<any[]> {
    const response = await this.httpClient.get<any>(`/api/clients/${id}/appointments/history`);
    return response.items || response;
  }

  async getStats(id: string): Promise<ClientWithStats> {
    return this.httpClient.get<ClientWithStats>(`/api/clients/${id}/stats`);
  }
}
