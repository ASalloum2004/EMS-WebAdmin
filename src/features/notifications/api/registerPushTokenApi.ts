import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";

const REGISTER_PUSH_TOKEN_PATH = "fcm/register-token";

type RegisterPushTokenResponse = {
  status: boolean;
};

export async function registerPushToken(token: string): Promise<void> {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("A valid Firebase token is required.");
  }

  await apiRequest<RegisterPushTokenResponse>(REGISTER_PUSH_TOKEN_PATH, {
    body: JSON.stringify({
      device_type: "web",
      token: normalizedToken,
    }),
    cache: "no-store",
    method: "POST",
    requiresAuth: true,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });
}
