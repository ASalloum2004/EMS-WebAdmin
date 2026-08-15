import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  NotificationStatisticsData,
  NotificationStatisticsResponse,
} from "../types";

export const NOTIFICATION_STATISTICS_PATH = "notifications/statistics";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeNotificationStatisticsResponse(
  response: NotificationStatisticsResponse,
): NotificationStatisticsData {
  const statistics = response.data;

  if (
    !statistics ||
    typeof statistics !== "object" ||
    !isNonNegativeNumber(statistics.total_notifications) ||
    !isNonNegativeNumber(statistics.unread_notifications) ||
    !isNonNegativeNumber(statistics.read_notifications)
  ) {
    throw new Error("Unexpected notification statistics response format.");
  }

  return statistics;
}

export async function getNotificationStatistics(
  signal?: AbortSignal,
): Promise<NotificationStatisticsData> {
  const response = await apiRequest<NotificationStatisticsResponse>(
    NOTIFICATION_STATISTICS_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeNotificationStatisticsResponse(response);
}
