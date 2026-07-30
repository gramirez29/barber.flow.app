export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export type HttpRequestConfig = Record<string, unknown>;

export interface HttpClient {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}
