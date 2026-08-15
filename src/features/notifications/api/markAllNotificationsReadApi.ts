import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type { MarkAllNotificationsReadResponse } from "../types";

export const MARK_ALL_NOTIFICATIONS_READ_PATH = "notifications/read-all";

function normalizeMarkAllNotificationsReadResponse(
  response: MarkAllNotificationsReadResponse,
): MarkAllNotificationsReadResponse {
  if (
    !response ||
    typeof response !== "object" ||
    response.status !== true ||
    typeof response.message !== "string" ||
    response.data !== null
  ) {
    throw new Error("Unexpected mark all notifications as read response format.");
  }

  return response;
}

export async function markAllNotificationsRead(
  signal?: AbortSignal,
): Promise<MarkAllNotificationsReadResponse> {
  const response = await apiRequest<MarkAllNotificationsReadResponse>(
    MARK_ALL_NOTIFICATIONS_READ_PATH,
    {
      cache: "no-store",
      method: "PATCH",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeMarkAllNotificationsReadResponse(response);
}
