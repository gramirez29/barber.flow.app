// User entity
export interface User {
  id: string;
  name: string;
  email: string;
  userName: string;
  role: string;
}

export interface AuthenticatedUser extends User {
  token: string;
}
