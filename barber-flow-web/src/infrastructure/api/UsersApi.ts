import { HttpClient } from '../http';
import { AppStatusResponse } from '@application/dtos/responses';
import { SetBlockedRequest } from '@application/dtos/requests';

export class UsersApi {
  constructor(private httpClient: HttpClient) {}

  async getStatus(): Promise<AppStatusResponse> {
    return this.httpClient.get<AppStatusResponse>('/api/users/me/status');
  }

  async setBlocked(id: string, isBlocked: boolean): Promise<void> {
    const request: SetBlockedRequest = { isBlocked };
    await this.httpClient.patch(`/api/users/${id}/block`, request);
  }
}
