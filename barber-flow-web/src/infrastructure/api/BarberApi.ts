import { IBarberRepository } from '@domain/interfaces';
import { Barber } from '@domain/entities';
import { HttpClient } from '../http';
import { CreateBarberRequest, UpdateBarberRequest } from '@application/dtos/requests';

type ListResponse<T> = T[] | { items: T[] };

function unwrapItems<T>(response: ListResponse<T>): T[] {
  return Array.isArray(response) ? response : response.items;
}

export class BarberApi implements IBarberRepository {
  constructor(private httpClient: HttpClient) {}

  async search(query?: string): Promise<Barber[]> {
    const response = await this.httpClient.get<ListResponse<Barber>>('/api/barbers/search', {
      params: query ? { query } : undefined,
    });
    return unwrapItems(response);
  }

  async getById(id: string): Promise<Barber> {
    return this.httpClient.get<Barber>(`/api/barbers/getById/${id}`);
  }

  async create(request: CreateBarberRequest): Promise<Barber> {
    return this.httpClient.post<Barber>('/api/barbers/create', request);
  }

  async update(id: string, request: UpdateBarberRequest): Promise<Barber> {
    return this.httpClient.put<Barber>(`/api/barbers/update/${id}`, request);
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/api/barbers/delete/${id}`);
  }

  async getNextId(): Promise<string> {
    const response = await this.httpClient.get<{ nextId: string }>('/api/barbers/nextId');
    return response.nextId;
  }
}
