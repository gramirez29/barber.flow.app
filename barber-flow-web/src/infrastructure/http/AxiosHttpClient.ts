import axios, { AxiosInstance, AxiosError } from 'axios';
import { HttpClient } from './HttpClient';

export class AxiosHttpClient implements HttpClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor para manejar errores
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado, limpiar y redirigir a login
          this.clearAuthToken();
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  async get<T = any>(url: string, config?: any): Promise<T> {
    return this.client.get<any, T>(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.post<any, T>(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.put<any, T>(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.client.patch<any, T>(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.client.delete<any, T>(url, config);
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}
