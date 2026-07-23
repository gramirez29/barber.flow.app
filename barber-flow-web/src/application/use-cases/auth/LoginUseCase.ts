import { IAuthRepository } from '@domain/interfaces';
import { AuthenticatedUser } from '@domain/entities';
import { LoginRequest } from '@application/dtos/requests';

export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(request: LoginRequest): Promise<AuthenticatedUser> {
    const user = await this.authRepository.login(request.userName, request.password);
    await this.authRepository.saveUser(user);
    return user;
  }
}
