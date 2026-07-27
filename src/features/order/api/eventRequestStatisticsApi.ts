import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  EventRequestStatsData,
  EventRequestStatsResponse,
} from "../types";

export const EVENT_REQUEST_STATISTICS_PATH = "events/requests/stats";

const unexpectedResponseMessage =
  "Unexpected event request statistics response format.";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeEventRequestStatisticsResponse(
  response: EventRequestStatsResponse,
): EventRequestStatsData {
  const statistics = response?.data;

  if (
    response?.status !== true ||
    typeof response.message !== "string" ||
    !statistics ||
    typeof statistics !== "object" ||
    !isNonNegativeNumber(statistics.total_requests) ||
    !isNonNegativeNumber(statistics.pending_requests) ||
    !isNonNegativeNumber(statistics.approved_requests) ||
    !isNonNegativeNumber(statistics.rejected_requests)
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return statistics;
}

export async function getEventRequestStatistics(
  signal?: AbortSignal,
): Promise<EventRequestStatsData> {
  const response = await apiRequest<EventRequestStatsResponse>(
    EVENT_REQUEST_STATISTICS_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeEventRequestStatisticsResponse(response);
}
