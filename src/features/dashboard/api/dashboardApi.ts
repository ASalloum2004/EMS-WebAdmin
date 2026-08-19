import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  DashboardApiResponse,
  DashboardData,
  DashboardMetric,
  DashboardTrendPoint,
} from "../types";

export const DASHBOARD_PATH = "dashboard";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isDashboardMetric(value: unknown): value is DashboardMetric {
  return (
    isRecord(value) &&
    isNonNegativeNumber(value.total) &&
    isNonNegativeNumber(value.period)
  );
}

function isDashboardTrendPoint(value: unknown): value is DashboardTrendPoint {
  return (
    isRecord(value) && isString(value.date) && isNonNegativeNumber(value.value)
  );
}

function isDashboardTrend(value: unknown): value is readonly DashboardTrendPoint[] {
  return Array.isArray(value) && value.every(isDashboardTrendPoint);
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!isRecord(value)) {
    return false;
  }

  const { breakdowns, period, summary, trends } = value;

  if (!isRecord(period) || !isRecord(summary) || !isRecord(trends) || !isRecord(breakdowns)) {
    return false;
  }

  return (
    isNonNegativeNumber(period.days) &&
    isString(period.start) &&
    isString(period.end) &&
    isString(period.generated_at) &&
    isString(period.timezone) &&
    isDashboardMetric(summary.visitors) &&
    isDashboardMetric(summary.companies) &&
    isDashboardMetric(summary.leads) &&
    isRecord(summary.booths) &&
    isNonNegativeNumber(summary.booths.total) &&
    isNonNegativeNumber(summary.booths.allocated) &&
    isNonNegativeNumber(summary.booths.available) &&
    isNonNegativeNumber(summary.pending_booth_requests) &&
    isNonNegativeNumber(summary.upcoming_events_30_days) &&
    isNonNegativeNumber(summary.open_reports) &&
    isDashboardTrend(trends.visitors) &&
    isDashboardTrend(trends.companies) &&
    isDashboardTrend(trends.booth_requests) &&
    isDashboardTrend(trends.leads) &&
    isDashboardTrend(trends.events) &&
    isRecord(breakdowns.visitor_gender) &&
    isNonNegativeNumber(breakdowns.visitor_gender.female) &&
    isNonNegativeNumber(breakdowns.visitor_gender.male) &&
    isRecord(breakdowns.booth_status) &&
    isNonNegativeNumber(breakdowns.booth_status.allocated) &&
    isNonNegativeNumber(breakdowns.booth_status.available) &&
    isRecord(breakdowns.request_status) &&
    isNonNegativeNumber(breakdowns.request_status.approved) &&
    isNonNegativeNumber(breakdowns.request_status.pending) &&
    isNonNegativeNumber(breakdowns.request_status.rejected)
  );
}

export function normalizeDashboardResponse(
  response: DashboardApiResponse,
): DashboardData {
  if (!isDashboardData(response.data)) {
    throw new Error("Unexpected dashboard response format.");
  }

  return response.data;
}

export async function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const response = await apiRequest<DashboardApiResponse>(DASHBOARD_PATH, {
    cache: "no-store",
    method: "GET",
    requiresAuth: true,
    signal,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  return normalizeDashboardResponse(response);
}
