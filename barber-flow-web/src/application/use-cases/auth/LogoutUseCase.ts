import { IAuthRepository } from '@domain/interfaces';

export class LogoutUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<void> {
    await this.authRepository.clearUser();
    await this.authRepository.logout();
  }
}
