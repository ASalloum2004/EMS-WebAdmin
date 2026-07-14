import type { BoothRequestStatisticsData } from "../types";

export type OrderSummaryStatistics = {
  approved: number | null;
  pending: number | null;
  total: number | null;
};

export function getOrderSummaryStatistics(
  statistics: BoothRequestStatisticsData | null,
): OrderSummaryStatistics {
  return {
    approved: statistics?.approved_requests ?? null,
    pending: statistics?.pending_requests ?? null,
    total: statistics?.total_requests ?? null,
  };
}
