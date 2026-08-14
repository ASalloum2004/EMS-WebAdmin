import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  BusApiData,
  BusPagination,
  BusResponse,
  BusesResponse,
  CreateBusPayload,
  DeleteBusResponse,
  GetBusesParams,
  GetBusesResult,
  UpdateBusPayload,
} from "../types";

export const DEFAULT_BUSES_PER_PAGE = 5;

const BUSES_PATH = "buses";
const unexpectedResponseMessage = "Unexpected buses response format.";

function getPositiveInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 1) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue) && parsedValue >= 1) {
      return Math.trunc(parsedValue);
    }
  }

  return undefined;
}

function getNonNegativeInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue) && parsedValue >= 0) {
      return Math.trunc(parsedValue);
    }
  }

  return undefined;
}

function isBusApiData(value: unknown): value is BusApiData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const bus = value as Record<string, unknown>;

  return (
    typeof bus.id === "number" &&
    Number.isFinite(bus.id) &&
    typeof bus.location === "string" &&
    typeof bus.start_time === "string" &&
    typeof bus.end_time === "string" &&
    typeof bus.duration === "number" &&
    Number.isFinite(bus.duration)
  );
}

export function buildBusesPath(params: GetBusesParams = {}) {
  const queryParams = new URLSearchParams();
  const location = params.location?.trim();
  const perPage = getPositiveInteger(params.perPage);
  const page = getPositiveInteger(params.page);

  if (location) {
    queryParams.set("filter[location]", location);
  }

  if (perPage) {
    queryParams.set("per_page", String(perPage));
  }

  if (page) {
    queryParams.set("page", String(page));
  }

  const queryString = queryParams.toString();

  return queryString ? `${BUSES_PATH}?${queryString}` : BUSES_PATH;
}

export function normalizeBusesResponse(response: BusesResponse): GetBusesResult {
  const buses = response.data?.data;

  if (!Array.isArray(buses) || !buses.every(isBusApiData)) {
    throw new Error(unexpectedResponseMessage);
  }

  const pagination: BusPagination = {
    currentPage: getPositiveInteger(response.data.current_page),
    perPage: getPositiveInteger(response.data.per_page),
    totalItems: getNonNegativeInteger(response.data.total),
    totalPages: getPositiveInteger(response.data.last_page),
  };

  return { buses, pagination };
}

export async function getBuses(
  params: GetBusesParams = {},
  signal?: AbortSignal,
): Promise<GetBusesResult> {
  const response = await apiRequest<BusesResponse>(buildBusesPath(params), {
    method: "GET",
    requiresAuth: true,
    signal,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  return normalizeBusesResponse(response);
}

export async function getBus(busId: number): Promise<BusApiData> {
  const response = await apiRequest<BusResponse>(`${BUSES_PATH}/${busId}`, {
    method: "GET",
    requiresAuth: true,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  return response.data;
}

export async function createBus(
  payload: CreateBusPayload,
): Promise<BusApiData> {
  const response = await apiRequest<BusResponse>(BUSES_PATH, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateBus(
  busId: number,
  payload: UpdateBusPayload,
): Promise<BusApiData> {
  const response = await apiRequest<BusResponse>(`${BUSES_PATH}/${busId}`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function deleteBus(busId: number): Promise<void> {
  await apiRequest<DeleteBusResponse>(`${BUSES_PATH}/${busId}`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
