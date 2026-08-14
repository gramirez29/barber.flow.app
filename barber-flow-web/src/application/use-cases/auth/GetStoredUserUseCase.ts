import { IAuthRepository } from '@domain/interfaces';
import { AuthenticatedUser } from '@domain/entities';

export class GetStoredUserUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<AuthenticatedUser | null> {
    return this.authRepository.getStoredUser();
  }
}
