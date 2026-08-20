import { ApiRequestError, apiRequest } from "../../../api";
import type {
  ApproveEventRequestOptions,
  ApproveEventRequestPayload,
  ApproveEventRequestResult,
  EventRequestActionResponse,
  EventRequestConflict,
  EventRequestConflictMeta,
  EventRequestStatus,
} from "../types";

type JsonRecord = Record<string, unknown>;

function validateEventRequestId(eventRequestId: number) {
  if (
    !Number.isFinite(eventRequestId) ||
    !Number.isInteger(eventRequestId) ||
    eventRequestId < 1
  ) {
    throw new Error("A valid event request ID is required.");
  }
}

function validateConflictPage(page: number) {
  if (!Number.isFinite(page) || !Number.isInteger(page) || page < 1) {
    throw new Error("A valid conflict page is required.");
  }
}

export function buildApproveEventRequestPath(
  eventRequestId: number,
  page?: number,
) {
  validateEventRequestId(eventRequestId);

  if (page === undefined) {
    return `events/requests/${eventRequestId}/approve`;
  }

  validateConflictPage(page);

  return `events/requests/${eventRequestId}/approve?page=${page}`;
}

export function buildRejectEventRequestPath(eventRequestId: number) {
  validateEventRequestId(eventRequestId);

  return `events/requests/${eventRequestId}/reject`;
}

export function buildCancelEventRequestPath(eventRequestId: number) {
  validateEventRequestId(eventRequestId);

  return `events/requests/${eventRequestId}/cancel`;
}

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

function getTrimmedNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getEventRequestStatus(value: unknown): EventRequestStatus | null {
  const status = getTrimmedNullableString(value)?.toLowerCase();

  return status === "pending" || status === "approved" || status === "rejected"
    ? status
    : null;
}

function normalizeEventRequestConflict(
  value: unknown,
): EventRequestConflict | null {
  if (!isJsonRecord(value)) {
    return null;
  }

  const id = getPositiveInteger(value.id);

  if (id === null) {
    return null;
  }

  const eventable = isJsonRecord(value.eventable)
    ? { name: getTrimmedNullableString(value.eventable.name) }
    : null;

  return {
    id,
    title: getTrimmedNullableString(value.title),
    event_hall_id: getPositiveInteger(value.event_hall_id),
    type: getTrimmedNullableString(value.type),
    status: getEventRequestStatus(value.status),
    start_at: getTrimmedNullableString(value.start_at),
    end_at: getTrimmedNullableString(value.end_at),
    duration: getNonNegativeNumber(value.duration),
    created_at: getTrimmedNullableString(value.created_at),
    eventable,
  };
}

function normalizeEventRequestConflictMeta(
  value: unknown,
): EventRequestConflictMeta | null {
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

export function normalizeApproveEventRequestConflict(
  error: ApiRequestError,
): Extract<ApproveEventRequestResult, { kind: "conflict" }> | null {
  const errorsData = error.errors?.data;

  if (!isJsonRecord(errorsData) || !Array.isArray(errorsData.data)) {
    return null;
  }

  const meta = normalizeEventRequestConflictMeta(errorsData.meta);

  if (!meta) {
    return null;
  }

  const requests: EventRequestConflict[] = [];

  for (const request of errorsData.data) {
    const normalizedRequest = normalizeEventRequestConflict(request);

    if (!normalizedRequest) {
      return null;
    }

    requests.push(normalizedRequest);
  }

  return {
    kind: "conflict",
    message: error.responseMessage ?? null,
    requests,
    meta,
  };
}

export function normalizeEventRequestActionResponse(
  response: EventRequestActionResponse,
): EventRequestActionResponse {
  const message =
    typeof response.message === "string" ? response.message.trim() : "";

  if (response.status !== true || !message || response.data !== null) {
    throw new Error("Unexpected event request action response format.");
  }

  return {
    status: true,
    message,
    data: null,
  };
}

export async function approveEventRequest(
  eventRequestId: number,
  options: ApproveEventRequestOptions = { force: false },
): Promise<ApproveEventRequestResult> {
  const payload: ApproveEventRequestPayload = { force: options.force };
  const path = buildApproveEventRequestPath(
    eventRequestId,
    options.force ? undefined : options.page,
  );

  try {
    const response = await apiRequest<EventRequestActionResponse>(path, {
      body: JSON.stringify(payload),
      method: "POST",
      requiresAuth: true,
    });

    return {
      kind: "approved",
      response: normalizeEventRequestActionResponse(response),
    };
  } catch (requestError) {
    if (
      !options.force &&
      requestError instanceof ApiRequestError &&
      requestError.status === 409
    ) {
      const conflict = normalizeApproveEventRequestConflict(requestError);

      if (conflict) {
        return conflict;
      }
    }

    throw requestError;
  }
}

export async function rejectEventRequest(
  eventRequestId: number,
): Promise<EventRequestActionResponse> {
  const response = await apiRequest<EventRequestActionResponse>(
    buildRejectEventRequestPath(eventRequestId),
    {
      method: "PATCH",
      requiresAuth: true,
    },
  );

  return normalizeEventRequestActionResponse(response);
}

export async function cancelEventRequest(
  eventRequestId: number,
): Promise<EventRequestActionResponse> {
  const response = await apiRequest<EventRequestActionResponse>(
    buildCancelEventRequestPath(eventRequestId),
    { method: "PATCH", requiresAuth: true },
  );

  return normalizeEventRequestActionResponse(response);
}
