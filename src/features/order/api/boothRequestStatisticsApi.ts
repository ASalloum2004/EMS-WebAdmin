import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  BoothRequestStatisticsData,
  BoothRequestStatisticsResponse,
} from "../types";

export const BOOTH_REQUEST_STATISTICS_PATH = "booths/requests/stats";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeBoothRequestStatisticsResponse(
  response: BoothRequestStatisticsResponse,
): BoothRequestStatisticsData {
  const statistics = response.data;

  if (
    !statistics ||
    typeof statistics !== "object" ||
    !isNonNegativeNumber(statistics.total_requests) ||
    !isNonNegativeNumber(statistics.pending_requests) ||
    !isNonNegativeNumber(statistics.approved_requests)
  ) {
    throw new Error("Unexpected booth request statistics response format.");
  }

  return statistics;
}

export async function getBoothRequestStatistics(
  signal?: AbortSignal,
): Promise<BoothRequestStatisticsData> {
  const response = await apiRequest<BoothRequestStatisticsResponse>(
    BOOTH_REQUEST_STATISTICS_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeBoothRequestStatisticsResponse(response);
}
