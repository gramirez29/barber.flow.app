import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { HttpClient, HttpRequestConfig } from './HttpClient';

const AUTH_STORAGE_KEY = 'barber_flow_auth';

function getStoredToken(): string | null {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    const user = JSON.parse(data);
    return user?.token ?? null;
  } catch {
    return null;
  }
}

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

    // Request interceptor: adjunta el token guardado en cada instancia,
    // ya que cada hook/feature crea su propia instancia de AxiosHttpClient
    // y setAuthToken() solo afecta a la instancia sobre la que se llama.
    this.client.interceptors.request.use((config) => {
      const token = getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
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

        const data = error.response?.data as { code?: string } | undefined;
        if (error.response?.status === 403 && data?.code === 'ACCOUNT_BLOCKED') {
          // Cuenta bloqueada por falta de pago: la sesión sigue siendo válida (no se
          // limpia el token), solo se redirige a la pantalla de bloqueo de inmediato,
          // sin esperar al próximo poll de estado.
          if (window.location.pathname !== '/blocked') {
            window.location.href = '/blocked';
          }
        }

        // Preserve a real Error (with the actual Axios failure reason, e.g. "Network Error" or
        // a timeout message) when there's no response body to reject with instead - rejecting
        // with a bare string here made every `catch` that checks `err instanceof Error` fall
        // back to a generic, unhelpful message for connectivity failures, masking what actually
        // went wrong.
        return Promise.reject(error.response?.data || new Error(error.message));
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
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
