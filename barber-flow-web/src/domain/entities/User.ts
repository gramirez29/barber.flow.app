// User entity
export interface User {
  id: string;
  name: string;
  email: string;
  userName: string;
  role: string;
  isBlocked?: boolean;
}

export interface AuthenticatedUser extends User {
  token: string;
}
