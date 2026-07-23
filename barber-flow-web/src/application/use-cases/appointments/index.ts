import { IAppointmentRepository } from '@domain/interfaces';
import { Appointment } from '@domain/entities';
import { CreateAppointmentRequest, UpdateAppointmentRequest, MoveAppointmentRequest } from '@application/dtos/requests';

export class GetAppointmentsByDateUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(date: string): Promise<Appointment[]> {
    return this.appointmentRepository.getByDate(date);
  }
}

export class CreateAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(request: CreateAppointmentRequest): Promise<Appointment> {
    return this.appointmentRepository.create(request);
  }
}

export class UpdateAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(id: string, request: UpdateAppointmentRequest): Promise<Appointment> {
    return this.appointmentRepository.update(id, request);
  }
}

export class MoveAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(request: MoveAppointmentRequest): Promise<Appointment> {
    return this.appointmentRepository.move(request.id, request.newDate, request.newTime);
  }
}

export class DeleteAppointmentUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(id: string): Promise<void> {
    return this.appointmentRepository.delete(id);
  }
}

export class SearchAppointmentsUseCase {
  constructor(private appointmentRepository: IAppointmentRepository) {}

  async execute(query: string): Promise<Appointment[]> {
    return this.appointmentRepository.search(query);
  }
}
