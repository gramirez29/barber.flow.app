import { IAppointmentRepository } from '@domain/interfaces';
import { Appointment } from '@domain/entities';
import { HttpClient } from '../http';
import { CreateAppointmentRequest, UpdateAppointmentRequest } from '@application/dtos/requests';

export class AppointmentApi implements IAppointmentRepository {
  constructor(private httpClient: HttpClient) {}

  async getByDate(date: string): Promise<Appointment[]> {
    const response = await this.httpClient.get<any>('/api/appointments/search', {
      params: { date },
    });
    return response.items || response;
  }

  async getById(id: string): Promise<Appointment> {
    return this.httpClient.get<Appointment>(`/api/appointments/getById/${id}`);
  }

  async create(request: CreateAppointmentRequest): Promise<Appointment> {
    return this.httpClient.post<Appointment>('/api/appointments/create', request);
  }

  async update(id: string, request: UpdateAppointmentRequest): Promise<Appointment> {
    return this.httpClient.put<Appointment>(`/api/appointments/update/${id}`, request);
  }

  async move(id: string, newDate: string, newTime: string): Promise<Appointment> {
    return this.httpClient.patch<Appointment>(`/api/appointments/move/${id}`, {
      newDate,
      newTime,
    });
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete(`/api/appointments/delete/${id}`);
  }

  async search(query: string): Promise<Appointment[]> {
    const response = await this.httpClient.get<any>('/api/appointments/search', {
      params: { query },
    });
    return response.items || response;
  }
}
