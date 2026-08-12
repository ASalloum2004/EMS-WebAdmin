import { apiRequest } from "../../../api";
import type {
  RejectReportPayload,
  ReportActionResponse,
  ResolveReportPayload,
} from "../types";

function validateReportId(reportId: number) {
  if (!Number.isInteger(reportId) || reportId < 1) {
    throw new Error("A valid Report ID is required.");
  }
}

export function buildResolveReportPath(reportId: number) {
  validateReportId(reportId);

  return `reports/${reportId}/resolved`;
}

export function buildRejectReportPath(reportId: number) {
  validateReportId(reportId);

  return `reports/${reportId}/rejected`;
}

function normalizeReportActionResponse(
  response: unknown,
): ReportActionResponse {
  if (
    typeof response !== "object" ||
    response === null ||
    Array.isArray(response)
  ) {
    throw new Error("Unexpected Report action response format.");
  }

  return response as ReportActionResponse;
}

async function runReportAction(
  path: string,
  payload: ResolveReportPayload | RejectReportPayload,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(path, {
    body: JSON.stringify(payload),
    method: "POST",
    requiresAuth: true,
    signal,
  });

  return normalizeReportActionResponse(response);
}

export function resolveReport(
  reportId: number,
  payload: ResolveReportPayload = {},
  signal?: AbortSignal,
) {
  return runReportAction(
    buildResolveReportPath(reportId),
    payload,
    signal,
  );
}

export function rejectReport(
  reportId: number,
  payload: RejectReportPayload = {},
  signal?: AbortSignal,
) {
  return runReportAction(
    buildRejectReportPath(reportId),
    payload,
    signal,
  );
}
