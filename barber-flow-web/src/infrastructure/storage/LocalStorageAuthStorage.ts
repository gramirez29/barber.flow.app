import { AuthenticatedUser } from '@domain/entities';

const AUTH_STORAGE_KEY = 'barber_flow_auth';

export class LocalStorageAuthStorage {
  saveUser(user: AuthenticatedUser): void {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  getUser(): AuthenticatedUser | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error retrieving user from storage:', error);
      return null;
    }
  }

  clearUser(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  }
}
