import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type { MarkNotificationReadResponse } from "../types";

const MARK_NOTIFICATION_READ_PATH_PREFIX = "notifications";

export function buildMarkNotificationReadPath(notificationId: string) {
  const normalizedNotificationId = notificationId.trim();

  if (!normalizedNotificationId) {
    throw new Error("A valid notification ID is required.");
  }

  return `${MARK_NOTIFICATION_READ_PATH_PREFIX}/${encodeURIComponent(
    normalizedNotificationId,
  )}/read`;
}

export async function markNotificationRead(
  notificationId: string,
  signal?: AbortSignal,
): Promise<MarkNotificationReadResponse> {
  return apiRequest<MarkNotificationReadResponse>(
    buildMarkNotificationReadPath(notificationId),
    {
      cache: "no-store",
      method: "PATCH",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );
}
