import { Appointment, Client, ClientWithStats, CreateClientRequest, UpdateClientRequest } from '../entities';

export interface IClientRepository {
  search(query: string): Promise<Client[]>;
  getById(id: string): Promise<Client>;
  create(request: CreateClientRequest): Promise<Client>;
  update(id: string, request: UpdateClientRequest): Promise<Client>;
  delete(id: string): Promise<void>;
  getAppointmentHistory(id: string): Promise<Appointment[]>;
  getStats(id: string): Promise<ClientWithStats>;
}
