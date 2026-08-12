import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  ReportStatisticsData,
  ReportStatisticsResponse,
} from "../types";

export const REPORT_STATISTICS_PATH = "reports/statistics";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeReportStatisticsResponse(
  response: ReportStatisticsResponse,
): ReportStatisticsData {
  const statistics = response.data;

  if (
    !statistics ||
    typeof statistics !== "object" ||
    !isNonNegativeNumber(statistics.total_requests) ||
    !isNonNegativeNumber(statistics.pending_requests) ||
    !isNonNegativeNumber(statistics.resolved_requests) ||
    !isNonNegativeNumber(statistics.rejected_requests)
  ) {
    throw new Error("Unexpected report statistics response format.");
  }

  return statistics;
}

export async function getReportStatistics(
  signal?: AbortSignal,
): Promise<ReportStatisticsData> {
  const response = await apiRequest<ReportStatisticsResponse>(
    REPORT_STATISTICS_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeReportStatisticsResponse(response);
}
