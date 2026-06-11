import type { AuthSession, LoginCredentials } from "../../../types";

const MOCK_AUTH_TOKEN = "local-auth-token";

export function login(credentials: LoginCredentials): Promise<AuthSession> {
  console.log("Email:", credentials.email);
  console.log("Password:", credentials.password);

  return Promise.resolve({
    token: MOCK_AUTH_TOKEN,
    user: {
      id: "admin-user",
      email: credentials.email,
      name: "Admin User",
      role: "admin",
    },
  });
}
