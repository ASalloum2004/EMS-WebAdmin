import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  GetReportsParams,
  GetReportsResult,
  ReportItem,
  ReportStatus,
  ReportsResponse,
} from "../types";

export const DEFAULT_REPORTS_PER_PAGE = 4;

const unexpectedResponseMessage = "Unexpected reports response format.";

function getPositiveInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

function getNonNegativeInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReportStatus(value: unknown): value is ReportStatus {
  return value === "pending" || value === "resolved" || value === "rejected";
}

function normalizeReport(item: unknown): ReportItem {
  if (
    !isRecord(item) ||
    (item.admin_notes !== null && typeof item.admin_notes !== "string") ||
    typeof item.id !== "number" ||
    typeof item.title !== "string" ||
    !isReportStatus(item.status) ||
    typeof item.created_at !== "string"
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return {
    admin_notes: item.admin_notes,
    created_at: item.created_at,
    id: item.id,
    status: item.status,
    title: item.title,
  };
}

export function buildReportsPath(params: GetReportsParams = {}) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_REPORTS_PER_PAGE;
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  const search = params.search?.trim();

  if (search) {
    queryParams.set("filter[search]", search);
  }

  if (isReportStatus(params.status)) {
    queryParams.set("filter[status]", params.status);
  }

  return `reports?${queryParams.toString()}`;
}

export function normalizeReportsResponse(
  response: ReportsResponse,
  requestedParams: GetReportsParams = {},
): GetReportsResult {
  const responseData: unknown = isRecord(response) ? response.data : undefined;

  if (!isRecord(responseData) || !Array.isArray(responseData.data)) {
    throw new Error(unexpectedResponseMessage);
  }

  const reports = responseData.data.map(normalizeReport);
  const currentPage =
    getPositiveInteger(responseData.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(responseData.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_REPORTS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(responseData.total) ?? reports.length;
  const totalPages =
    getPositiveInteger(responseData.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
    reports,
  };
}

export async function getReports(
  params: GetReportsParams = {},
  signal?: AbortSignal,
): Promise<GetReportsResult> {
  const response = await apiRequest<ReportsResponse>(buildReportsPath(params), {
    cache: "no-store",
    method: "GET",
    requiresAuth: true,
    signal,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  return normalizeReportsResponse(response, params);
}
