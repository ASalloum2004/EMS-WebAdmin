import { apiRequest } from "../../../api";
import { getAuthSession } from "../utils/authStorage";

type LogoutResponse = Record<string, never>;

export function logout(): Promise<LogoutResponse> {
  const session = getAuthSession();

  return apiRequest<LogoutResponse>("logout", {
    method: "POST",
    headers: session?.token
      ? {
          Authorization: `Bearer ${session.token}`,
        }
      : undefined,
  });
}
