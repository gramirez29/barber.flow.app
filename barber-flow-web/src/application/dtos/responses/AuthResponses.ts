export interface UserResponse {
  id: string;
  name: string;
  email: string;
  userName: string;
  role: string;
  token: string;
  isBlocked: boolean;
}

export interface AppStatusResponse {
  isBlocked: boolean;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}
