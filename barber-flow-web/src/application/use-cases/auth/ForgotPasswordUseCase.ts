import { IAuthRepository } from '@domain/interfaces';
import { ForgotPasswordRequest, ResetPasswordRequest, VerifyOtpRequest } from '@application/dtos/requests';

export class ForgotPasswordUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async requestOtp(request: ForgotPasswordRequest): Promise<{ message: string }> {
    return this.authRepository.forgotPassword(request.email);
  }

  async verifyOtp(request: VerifyOtpRequest): Promise<{ message: string }> {
    return this.authRepository.verifyOtp(request.email, request.otpCode);
  }

  async resetPassword(request: ResetPasswordRequest): Promise<{ message: string }> {
    return this.authRepository.resetPassword(request.email, request.otpCode, request.newPassword);
  }
}
