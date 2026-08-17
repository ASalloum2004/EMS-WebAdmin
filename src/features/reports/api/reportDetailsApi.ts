import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  ReportDetails,
  ReportDetailsResponse,
  ReportStatus,
} from "../types";

const unexpectedResponseMessage =
  "Unexpected report details response format.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isReportStatus(value: unknown): value is ReportStatus {
  return value === "pending" || value === "resolved" || value === "rejected";
}

function normalizeReportable(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    (value.number !== undefined && typeof value.number !== "string") ||
    (value.title !== undefined && typeof value.title !== "string")
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return {
    id: value.id,
    ...(typeof value.number === "string" ? { number: value.number } : {}),
    ...(typeof value.title === "string" ? { title: value.title } : {}),
  };
}

function normalizeReporter(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (
    !isRecord(value) ||
    !isPositiveInteger(value.id) ||
    typeof value.name !== "string"
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return {
    id: value.id,
    name: value.name,
  };
}

export function buildReportDetailsPath(reportId: number) {
  if (!isPositiveInteger(reportId)) {
    throw new Error("A valid Report ID is required.");
  }

  return `reports/${reportId}`;
}

export function normalizeReportDetailsResponse(
  response: ReportDetailsResponse,
): ReportDetails {
  const details: unknown = isRecord(response) ? response.data : undefined;

  if (
    !isRecord(details) ||
    !isPositiveInteger(details.id) ||
    typeof details.title !== "string" ||
    typeof details.description !== "string" ||
    !isReportStatus(details.status) ||
    (details.admin_notes !== null &&
      typeof details.admin_notes !== "string") ||
    typeof details.created_at !== "string"
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  const reportable = normalizeReportable(details.reportable);
  const reporter = normalizeReporter(details.reporter);

  return {
    admin_notes: details.admin_notes,
    created_at: details.created_at,
    description: details.description,
    id: details.id,
    reportable,
    reporter,
    status: details.status,
    title: details.title,
  };
}

export async function getReportDetails(
  reportId: number,
  signal?: AbortSignal,
): Promise<ReportDetails> {
  const response = await apiRequest<ReportDetailsResponse>(
    buildReportDetailsPath(reportId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeReportDetailsResponse(response);
}
