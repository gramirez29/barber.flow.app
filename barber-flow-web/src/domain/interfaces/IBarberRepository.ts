import { Barber } from '../entities';
import { CreateBarberRequest, UpdateBarberRequest } from '@application/dtos/requests';

export interface IBarberRepository {
  search(query?: string): Promise<Barber[]>;
  getById(id: string): Promise<Barber>;
  create(request: CreateBarberRequest): Promise<Barber>;
  update(id: string, request: UpdateBarberRequest): Promise<Barber>;
  delete(id: string): Promise<void>;
  getNextId(): Promise<string>;
}
