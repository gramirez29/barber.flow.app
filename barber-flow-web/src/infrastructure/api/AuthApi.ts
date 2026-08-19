import { IAuthRepository } from '@domain/interfaces';
import { AuthenticatedUser } from '@domain/entities';
import { HttpClient } from '../http';
import { LocalStorageAuthStorage } from '../storage/LocalStorageAuthStorage';
import { LoginRequest, ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest } from '@application/dtos/requests';
import { UserResponse } from '@application/dtos/responses';

export class AuthApi implements IAuthRepository {
  private storage: LocalStorageAuthStorage;

  constructor(private httpClient: HttpClient) {
    this.storage = new LocalStorageAuthStorage();
  }

  async login(userName: string, password: string): Promise<AuthenticatedUser> {
    const request: LoginRequest = { userName, password };
    const response = await this.httpClient.post<UserResponse>('/api/users/authentication', request);
    
    const user: AuthenticatedUser = {
      id: response.id,
      name: response.name,
      email: response.email,
      userName: response.userName,
      role: response.role,
      token: response.token,
      isBlocked: response.isBlocked,
    };

    this.httpClient.setAuthToken(user.token);
    return user;
  }

  async logout(): Promise<void> {
    // API call si es necesario
    this.httpClient.clearAuthToken();
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const request: ForgotPasswordRequest = { email };
    return this.httpClient.post<{ message: string }>('/api/auth/forgot-password', request);
  }

  async verifyOtp(email: string, otp: string): Promise<{ message: string }> {
    const request: VerifyOtpRequest = { email, otpCode: otp };
    return this.httpClient.post<{ message: string }>('/api/auth/verify-otp', request);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }> {
    const request: ResetPasswordRequest = { email, otpCode: otp, newPassword };
    return this.httpClient.post<{ message: string }>('/api/auth/reset-password', request);
  }

  async deleteSelf(): Promise<void> {
    await this.httpClient.delete('/api/users/me');
  }

  async getStoredUser(): Promise<AuthenticatedUser | null> {
    const user = this.storage.getUser();
    if (user) {
      this.httpClient.setAuthToken(user.token);
    }
    return user;
  }

  async saveUser(user: AuthenticatedUser): Promise<void> {
    this.storage.saveUser(user);
    this.httpClient.setAuthToken(user.token);
  }

  async clearUser(): Promise<void> {
    this.storage.clearUser();
    this.httpClient.clearAuthToken();
  }
}
