export interface UserResponse {
  id: string;
  name: string;
  email: string;
  userName: string;
  role: string;
  token: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}
