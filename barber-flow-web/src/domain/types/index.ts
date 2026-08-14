// Domain types
export type Result<T> = { success: true; data: T } | { success: false; error: string };

export type ApiResponse<T> = {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
};
