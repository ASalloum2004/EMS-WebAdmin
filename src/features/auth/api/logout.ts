import { apiRequest } from "../../../api";

type LogoutResponse = Record<string, never>;

export function logout(): Promise<LogoutResponse> {
  return apiRequest<LogoutResponse>("logout", {
    method: "POST",
    requiresAuth: true,
  });
}
