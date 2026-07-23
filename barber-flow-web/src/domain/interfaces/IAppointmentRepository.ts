import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../entities';

export interface IAppointmentRepository {
  getByDate(date: string): Promise<Appointment[]>;
  getById(id: string): Promise<Appointment>;
  create(request: CreateAppointmentRequest): Promise<Appointment>;
  update(id: string, request: UpdateAppointmentRequest): Promise<Appointment>;
  move(id: string, newDate: string, newTime: string): Promise<Appointment>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Appointment[]>;
}
