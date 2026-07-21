import { apiRequest } from "../../../api";
import type {
  EventRequestsResponse,
  EventRequestUiItem,
  GetEventRequestsParams,
  GetEventRequestsResult,
} from "../types";

export const DEFAULT_EVENT_REQUESTS_PER_PAGE = 15;

const unexpectedResponseMessage =
  "Unexpected event requests response format.";

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

function normalizeEventRequest(
  item: unknown,
): EventRequestUiItem {
  if (
    !isRecord(item) ||
    typeof item.id !== "number" ||
    typeof item.title !== "string" ||
    typeof item.event_hall_id !== "number" ||
    typeof item.type !== "string" ||
    typeof item.status !== "string" ||
    typeof item.start_at !== "string" ||
    typeof item.end_at !== "string" ||
    typeof item.created_at !== "string"
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return {
    id: item.id,
    title: item.title,
    event_hall_id: item.event_hall_id,
    type: item.type,
    status: item.status,
    start_at: item.start_at,
    end_at: item.end_at,
    created_at: item.created_at,
  };
}

export function buildEventRequestsPath(
  params: GetEventRequestsParams = {},
) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_EVENT_REQUESTS_PER_PAGE;
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  const title = params.title?.trim();

  if (title) {
    queryParams.set("filter[title]", title);
  }

  if (
    params.status === "pending" ||
    params.status === "approved" ||
    params.status === "rejected"
  ) {
    queryParams.set("filter[status]", params.status);
  }

  const createdDate = params.createdDate?.trim();

  if (createdDate) {
    queryParams.set("filter[created_date]", createdDate);
  }

  if (params.sort === "-created_at" || params.sort === "created_at") {
    queryParams.set("sort", params.sort);
  }

  return `events/requests?${queryParams.toString()}`;
}

export function normalizeEventRequestsResponse(
  response: EventRequestsResponse,
  requestedParams: GetEventRequestsParams = {},
): GetEventRequestsResult {
  const responseData: unknown = isRecord(response)
    ? response.data
    : undefined;

  if (
    !isRecord(responseData) ||
    !Array.isArray(responseData.data)
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  const requests = responseData.data.map(normalizeEventRequest);
  const currentPage =
    getPositiveInteger(responseData.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(responseData.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_EVENT_REQUESTS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(responseData.total) ?? requests.length;
  const totalPages =
    getPositiveInteger(responseData.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    requests,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getEventRequests(
  params: GetEventRequestsParams = {},
): Promise<GetEventRequestsResult> {
  const response = await apiRequest<EventRequestsResponse>(
    buildEventRequestsPath(params),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeEventRequestsResponse(response, params);
}
