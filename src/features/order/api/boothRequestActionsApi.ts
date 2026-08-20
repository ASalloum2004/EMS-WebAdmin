import { ApiRequestError, apiRequest } from "../../../api";
import type {
  ApproveBoothRequestOptions,
  ApproveBoothRequestPayload,
  ApproveBoothRequestResult,
  ApproveBoothRequestResponse,
  BoothRequestActionResponse,
  BoothRequestConflict,
  BoothRequestConflictMeta,
  BoothRequestStatus,
} from "../types";

function validateBoothRequestId(boothRequestId: number) {
  if (
    !Number.isFinite(boothRequestId) ||
    boothRequestId < 1 ||
    !Number.isInteger(boothRequestId)
  ) {
    throw new Error("A valid booth request ID is required.");
  }
}

export function buildRejectBoothRequestPath(boothRequestId: number) {
  validateBoothRequestId(boothRequestId);

  return `booths/requests/reject/${boothRequestId}`;
}

export function buildCancelBoothRequestPath(boothRequestId: number) {
  validateBoothRequestId(boothRequestId);

  return `booths/${boothRequestId}/cancel`;
}

function validatePage(page: number) {
  if (!Number.isFinite(page) || page < 1 || !Number.isInteger(page)) {
    throw new Error("A valid conflict page is required.");
  }
}

export function buildApproveBoothRequestPath(
  boothRequestId: number,
  page?: number,
) {
  validateBoothRequestId(boothRequestId);

  if (page === undefined) {
    return `booths/requests/approve/${boothRequestId}`;
  }

  validatePage(page);

  return `booths/requests/approve/${boothRequestId}?page=${page}`;
}

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPositiveInteger(value: unknown) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : null;
}

function getNonNegativeInteger(value: unknown) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : null;
}

function getNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getBoothRequestStatus(value: unknown): BoothRequestStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  const status = value.trim().toLowerCase();

  return status === "pending" || status === "approved" || status === "rejected"
    ? status
    : null;
}

function normalizeBoothRequestConflict(
  value: unknown,
): BoothRequestConflict | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  return {
    booth_id: getPositiveInteger(value.booth_id),
    company_id: getPositiveInteger(value.company_id),
    final_price: getNonNegativeNumber(value.final_price),
    id: getPositiveInteger(value.id),
    status: getBoothRequestStatus(value.status),
  };
}

function normalizeBoothRequestConflictMeta(
  value: unknown,
): BoothRequestConflictMeta | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  const currentPage = getPositiveInteger(value.current_page);
  const perPage = getPositiveInteger(value.per_page);
  const total = getNonNegativeInteger(value.total);
  const lastPage = getPositiveInteger(value.last_page);

  if (
    currentPage === null ||
    perPage === null ||
    total === null ||
    lastPage === null ||
    currentPage > lastPage
  ) {
    return null;
  }

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
  };
}

function normalizeApproveBoothRequestConflict(
  error: ApiRequestError,
): Extract<ApproveBoothRequestResult, { kind: "conflict" }> | null {
  const errorsData = error.errors?.data;

  if (!isJsonRecord(errorsData) || !Array.isArray(errorsData.data)) {
    return null;
  }

  const meta = normalizeBoothRequestConflictMeta(errorsData.meta);
  const requests: BoothRequestConflict[] = [];

  if (!meta) {
    return null;
  }

  for (const request of errorsData.data) {
    const normalizedRequest = normalizeBoothRequestConflict(request);

    if (!normalizedRequest) {
      return null;
    }

    requests.push(normalizedRequest);
  }

  const message = error.message.trim();

  if (!message) {
    return null;
  }

  return {
    kind: "conflict",
    message,
    requests,
    meta,
  };
}

export function normalizeBoothRequestActionResponse(
  response: BoothRequestActionResponse,
): BoothRequestActionResponse {
  const message =
    typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true || !message || response.data !== null) {
    throw new Error("Unexpected booth request action response format.");
  }

  return {
    status: true,
    message,
    data: null,
  };
}

export async function rejectBoothRequest(
  boothRequestId: number,
): Promise<BoothRequestActionResponse> {
  const response = await apiRequest<BoothRequestActionResponse>(
    buildRejectBoothRequestPath(boothRequestId),
    {
      method: "PATCH",
      requiresAuth: true,
    },
  );

  return normalizeBoothRequestActionResponse(response);
}

export async function cancelBoothRequest(
  boothRequestId: number,
): Promise<BoothRequestActionResponse> {
  const response = await apiRequest<BoothRequestActionResponse>(
    buildCancelBoothRequestPath(boothRequestId),
    { method: "PATCH", requiresAuth: true },
  );

  return normalizeBoothRequestActionResponse(response);
}

export function normalizeApproveBoothRequestResponse(
  response: BoothRequestActionResponse,
): ApproveBoothRequestResponse {
  const message =
    typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true) {
    throw new Error(
      message || "Unexpected booth request action response format.",
    );
  }

  if (!message || response.data !== null) {
    throw new Error("Unexpected booth request action response format.");
  }

  return {
    status: true,
    message,
    data: null,
  };
}

export async function approveBoothRequest(
  boothRequestId: number,
  options: ApproveBoothRequestOptions = { force: false },
): Promise<ApproveBoothRequestResult> {
  const payload: ApproveBoothRequestPayload = { force: options.force };
  const path = buildApproveBoothRequestPath(
    boothRequestId,
    options.force ? undefined : options.page,
  );

  try {
    const response = await apiRequest<BoothRequestActionResponse>(path, {
      body: JSON.stringify(payload),
      method: "POST",
      requiresAuth: true,
    });

    return {
      kind: "approved",
      response: normalizeApproveBoothRequestResponse(response),
    };
  } catch (requestError) {
    if (
      !options.force &&
      requestError instanceof ApiRequestError &&
      requestError.status === 409
    ) {
      const conflict = normalizeApproveBoothRequestConflict(requestError);

      if (conflict) {
        return conflict;
      }
    }

    throw requestError;
  }
}
