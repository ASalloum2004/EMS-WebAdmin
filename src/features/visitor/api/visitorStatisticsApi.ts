import { apiRequest } from "../../../api";
import type {
  VisitorStatisticsData,
  VisitorStatisticsResponse,
} from "../types";

export const VISITOR_STATISTICS_PATH = "visitor/stats";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeVisitorStatisticsResponse(
  response: VisitorStatisticsResponse,
): VisitorStatisticsData {
  const statistics = response.data;

  if (
    !statistics ||
    typeof statistics !== "object" ||
    !isNonNegativeNumber(statistics.total_visitors) ||
    !isNonNegativeNumber(statistics.male_visitors) ||
    !isNonNegativeNumber(statistics.female_visitors)
  ) {
    throw new Error("Unexpected visitor statistics response format.");
  }

  return statistics;
}

export async function getVisitorStatistics(): Promise<VisitorStatisticsData> {
  const response = await apiRequest<VisitorStatisticsResponse>(
    VISITOR_STATISTICS_PATH,
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeVisitorStatisticsResponse(response);
}
