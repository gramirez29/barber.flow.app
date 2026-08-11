import { AuthenticatedUser } from '@domain/entities';

const AUTH_STORAGE_KEY = 'barber_flow_auth';
const NOTIFICATIONS_STORAGE_KEY = 'barber_flow_notifications';
const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'barber_flow_notifications_enabled';

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
      // Also clear cached client data (names/phones) so the next person to use this
      // device doesn't inherit the previous session's notification inbox.
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
      localStorage.removeItem(NOTIFICATIONS_ENABLED_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user from storage:', error);
    }
  }
}
