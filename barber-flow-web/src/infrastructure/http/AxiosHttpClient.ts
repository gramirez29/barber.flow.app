import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { HttpClient, HttpRequestConfig } from './HttpClient';

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

  async get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.client.get<T, T>(url, config as AxiosRequestConfig);
  }

  async post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    return this.client.post<T, T>(url, data, config as AxiosRequestConfig);
  }

  async put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    return this.client.put<T, T>(url, data, config as AxiosRequestConfig);
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T> {
    return this.client.patch<T, T>(url, data, config as AxiosRequestConfig);
  }

  async delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T> {
    return this.client.delete<T, T>(url, config as AxiosRequestConfig);
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}
