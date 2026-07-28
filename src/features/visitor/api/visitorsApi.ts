import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
import type {
  GetVisitorsParams,
  GetVisitorsResult,
  VisitorApiData,
  VisitorApiResponse,
} from "../types";

export const DEFAULT_VISITORS_PER_PAGE = 15;
export const VISITORS_PATH = "visitor";

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

function normalizeVisitor(visitor: VisitorApiData): VisitorApiData {
  return {
    ...visitor,
    avatar: resolveApiMediaUrl(visitor.avatar),
  };
}

export function buildVisitorsPath(params: GetVisitorsParams = {}) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_VISITORS_PER_PAGE;
  const queryParams = new URLSearchParams();
  const search = params.search?.trim();
  const job = params.job?.trim();
  const location = params.location?.trim();

  if (search) {
    queryParams.set("filter[search]", search);
  }

  if (params.gender === "male" || params.gender === "female") {
    queryParams.set("filter[gender]", params.gender);
  }

  if (job) {
    queryParams.set("filter[job]", job);
  }

  if (location) {
    queryParams.set("filter[location]", location);
  }

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  return `${VISITORS_PATH}?${queryParams.toString()}`;
}

export function normalizeVisitorsResponse(
  response: VisitorApiResponse,
  requestedParams: GetVisitorsParams = {},
): GetVisitorsResult {
  if (
    !response.data ||
    typeof response.data !== "object" ||
    !Array.isArray(response.data.data)
  ) {
    throw new Error("Unexpected visitors response format.");
  }

  const visitors = response.data.data.map(normalizeVisitor);
  const currentPage =
    getPositiveInteger(response.data.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(response.data.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_VISITORS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(response.data.total) ?? visitors.length;
  const totalPages =
    getPositiveInteger(response.data.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    visitors,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getVisitors(
  params: GetVisitorsParams = {},
  signal?: AbortSignal,
): Promise<GetVisitorsResult> {
  const response = await apiRequest<VisitorApiResponse>(
    buildVisitorsPath(params),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeVisitorsResponse(response, params);
}
