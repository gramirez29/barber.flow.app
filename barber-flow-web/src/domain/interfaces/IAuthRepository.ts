import { AuthenticatedUser } from '../entities';

export interface IAuthRepository {
  login(userName: string, password: string): Promise<AuthenticatedUser>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string): Promise<{ message: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }>;
  deleteSelf(): Promise<void>;
  getStoredUser(): Promise<AuthenticatedUser | null>;
  saveUser(user: AuthenticatedUser): Promise<void>;
  clearUser(): Promise<void>;
}
