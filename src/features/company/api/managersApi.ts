import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  GetManagersParams,
  GetManagersResult,
  ManagerListApiData,
  ManagerListItem,
  ManagerSearchField,
  ManagersApiResponse,
} from "../types";

export const MANAGERS_PATH = "managers";
export const DEFAULT_MANAGERS_PER_PAGE = 15;

const MANAGER_SEARCH_FIELDS: readonly ManagerSearchField[] = [
  "name",
  "email",
  "phone",
];

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

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeManager(manager: ManagerListApiData): ManagerListItem {
  const internalId = getPositiveInteger(manager.id);

  if (!internalId) {
    throw new Error("Unexpected manager identifier.");
  }

  return {
    internalId,
    name: getTrimmedString(manager.name) ?? "",
    email: getTrimmedString(manager.email),
    avatar: getTrimmedString(manager.avatar),
    companiesCount: getNonNegativeInteger(manager.companies_count) ?? null,
    boothsCount: getNonNegativeInteger(manager.booths_count) ?? null,
  };
}

export function buildManagersPath(params: GetManagersParams = {}) {
  const queryParams = new URLSearchParams();
  const search = params.search?.trim();
  const searchField = MANAGER_SEARCH_FIELDS.includes(
    params.searchField ?? "name",
  )
    ? (params.searchField ?? "name")
    : "name";
  const page = getPositiveInteger(params.page) ?? 1;

  if (search) {
    queryParams.set(`filter[${searchField}]`, search);
  }

  queryParams.set("page", String(page));

  return `${MANAGERS_PATH}?${queryParams.toString()}`;
}

export function normalizeManagersResponse(
  response: ManagersApiResponse,
  requestedParams: GetManagersParams = {},
): GetManagersResult {
  if (
    !response.data ||
    typeof response.data !== "object" ||
    !Array.isArray(response.data.data)
  ) {
    throw new Error("Unexpected managers response format.");
  }

  const managers = response.data.data.map(normalizeManager);
  const currentPage =
    getPositiveInteger(response.data.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(response.data.per_page) ??
    DEFAULT_MANAGERS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(response.data.total) ?? managers.length;
  const totalPages =
    getPositiveInteger(response.data.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    managers,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getManagers(
  params: GetManagersParams = {},
  signal?: AbortSignal,
): Promise<GetManagersResult> {
  const response = await apiRequest<ManagersApiResponse>(
    buildManagersPath(params),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeManagersResponse(response, params);
}
