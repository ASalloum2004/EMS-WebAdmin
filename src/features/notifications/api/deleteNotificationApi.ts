import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type { DeleteNotificationResponse } from "../types";

const DELETE_NOTIFICATION_PATH_PREFIX = "notifications";

export function buildDeleteNotificationPath(notificationId: string) {
  const normalizedNotificationId = notificationId.trim();

  if (!normalizedNotificationId) {
    throw new Error("A valid notification ID is required.");
  }

  return `${DELETE_NOTIFICATION_PATH_PREFIX}/${encodeURIComponent(
    normalizedNotificationId,
  )}`;
}

export async function deleteNotification(
  notificationId: string,
  signal?: AbortSignal,
): Promise<DeleteNotificationResponse> {
  return apiRequest<DeleteNotificationResponse>(
    buildDeleteNotificationPath(notificationId),
    {
      cache: "no-store",
      method: "DELETE",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );
}
