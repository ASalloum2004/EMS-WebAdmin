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

export const ALL_NOTIFICATIONS_PATH = "notifications";

export function buildAllNotificationsPath(
  params: GetNotificationsParams = {},
) {
  return buildNotificationsPath(ALL_NOTIFICATIONS_PATH, params);
}

export async function getAllNotifications(
  params: GetNotificationsParams = {},
  signal?: AbortSignal,
): Promise<GetNotificationsResult> {
  const response = await apiRequest<NotificationsListResponse>(
    buildAllNotificationsPath(params),
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
