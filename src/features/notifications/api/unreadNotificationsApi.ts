import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  GetNotificationsParams,
  GetNotificationsResult,
  NotificationsListResponse,
} from "../types";
import {
  buildNotificationsPath,
  normalizeNotificationsResponse,
} from "./notificationApiUtils";

export const UNREAD_NOTIFICATIONS_PATH = "notifications/unread";

export function buildUnreadNotificationsPath(
  params: GetNotificationsParams = {},
) {
  return buildNotificationsPath(UNREAD_NOTIFICATIONS_PATH, params);
}

export async function getUnreadNotifications(
  params: GetNotificationsParams = {},
  signal?: AbortSignal,
): Promise<GetNotificationsResult> {
  const response = await apiRequest<NotificationsListResponse>(
    buildUnreadNotificationsPath(params),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeNotificationsResponse(response, params);
}
