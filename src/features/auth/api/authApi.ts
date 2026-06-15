import { apiRequest } from "../../../api";
import type { AuthSession, LoginCredentials } from "../../../types";

export function login(credentials: LoginCredentials): Promise<AuthSession> {
  return apiRequest<AuthSession>("login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });
}