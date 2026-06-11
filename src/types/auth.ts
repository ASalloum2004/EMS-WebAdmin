export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  id: string;
  name: string;
  role: "admin";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
