import { IClientRepository } from '@domain/interfaces';
import { Appointment, Client, ClientWithStats } from '@domain/entities';
import { CreateClientRequest, UpdateClientRequest, SearchClientRequest } from '@application/dtos/requests';

export class SearchClientsUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(request: SearchClientRequest): Promise<Client[]> {
    return this.clientRepository.search(request.query);
  }
}

export class CreateClientUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(request: CreateClientRequest): Promise<Client> {
    return this.clientRepository.create(request);
  }
}

export class UpdateClientUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(id: string, request: UpdateClientRequest): Promise<Client> {
    return this.clientRepository.update(id, request);
  }
}

export class DeleteClientUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(id: string): Promise<void> {
    return this.clientRepository.delete(id);
  }
}

export class GetClientStatsUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(id: string): Promise<ClientWithStats> {
    return this.clientRepository.getStats(id);
  }
}

export class GetClientAppointmentHistoryUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(id: string): Promise<Appointment[]> {
    return this.clientRepository.getAppointmentHistory(id);
  }
}
