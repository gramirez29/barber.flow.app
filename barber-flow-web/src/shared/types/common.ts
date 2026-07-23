/**
 * Common Types
 * Tipos comunes reutilizables en toda la aplicación
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export type AsyncThunk<T> = {
  loading: boolean;
  data: T | null;
  error: string | null;
};
