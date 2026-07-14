import { apiRequest } from "../../../api";
import type {
  BoothRequestsResponse,
  GetBoothRequestsParams,
  GetBoothRequestsResult,
} from "../types";

export const DEFAULT_BOOTH_REQUESTS_PER_PAGE = 15;

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

export function buildBoothRequestsPath(
  params: GetBoothRequestsParams = {},
) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_BOOTH_REQUESTS_PER_PAGE;
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

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

  return `booths/requests?${queryParams.toString()}`;
}

export function normalizeBoothRequestsResponse(
  response: BoothRequestsResponse,
  requestedParams: GetBoothRequestsParams = {},
): GetBoothRequestsResult {
  if (
    !response.data ||
    typeof response.data !== "object" ||
    !Array.isArray(response.data.data)
  ) {
    throw new Error("Unexpected booth requests response format.");
  }

  const requests = response.data.data;
  const currentPage =
    getPositiveInteger(response.data.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(response.data.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_BOOTH_REQUESTS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(response.data.total) ?? requests.length;
  const totalPages =
    getPositiveInteger(response.data.last_page) ??
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

export async function getBoothRequests(
  params: GetBoothRequestsParams = {},
): Promise<GetBoothRequestsResult> {
  const response = await apiRequest<BoothRequestsResponse>(
    buildBoothRequestsPath(params),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeBoothRequestsResponse(response, params);
}
