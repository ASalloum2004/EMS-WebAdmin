import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  GetServicesParams,
  GetServicesResult,
  ServiceApiData,
  ServicesResponse,
} from "../types";

type RawPaginationMeta = {
  current_page?: number | string;
  links?: Record<string, unknown>;
  per_page?: number | string;
  pagination?: Record<string, unknown>;
  total?: number | string;
  last_page?: number | string;
};

type NestedServicesData = {
  data: ServiceApiData[];
  links?: Record<string, unknown>;
  meta?: RawPaginationMeta;
  pagination?: RawPaginationMeta;
  current_page?: number | string;
  per_page?: number | string;
  total?: number | string;
  last_page?: number | string;
};

type NestedServicesResponse = Omit<ServicesResponse, "data"> & {
  data: NestedServicesData;
};

type ServicesApiResponse = (ServicesResponse | NestedServicesResponse) & {
  pagination?: RawPaginationMeta;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNestedServicesData(value: unknown): value is NestedServicesData {
  return isRecord(value) && Array.isArray(value.data);
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  return undefined;
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function getPageFromLink(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  try {
    const url = new URL(value, "https://ems.local");

    return getNumber(url.searchParams.get("page"));
  } catch {
    return undefined;
  }
}

function getLastPageFromLinks(...linksList: unknown[]) {
  for (const links of linksList) {
    const lastPage = getPageFromLink(getRecord(links).last);

    if (lastPage) {
      return lastPage;
    }
  }

  return undefined;
}

function getPaginationMeta(
  response: ServicesApiResponse,
  nestedData?: NestedServicesData,
): GetServicesResult["pagination"] {
  const responseMeta = getRecord(response.meta);
  const responseMetaPagination = getRecord(responseMeta.pagination);
  const responsePagination = getRecord(response.pagination);
  const nestedMeta = getRecord(nestedData?.meta);
  const nestedMetaPagination = getRecord(nestedMeta.pagination);
  const nestedPagination = getRecord(nestedData?.pagination);

  return {
    currentPage:
      getNumber(nestedMeta.current_page) ??
      getNumber(nestedMetaPagination.current_page) ??
      getNumber(nestedPagination.current_page) ??
      getNumber(nestedData?.current_page) ??
      getNumber(responseMeta.current_page) ??
      getNumber(responseMetaPagination.current_page) ??
      getNumber(responsePagination.current_page) ??
      getNumber(response.current_page),
    perPage:
      getNumber(nestedMeta.per_page) ??
      getNumber(nestedMetaPagination.per_page) ??
      getNumber(nestedPagination.per_page) ??
      getNumber(nestedData?.per_page) ??
      getNumber(responseMeta.per_page) ??
      getNumber(responseMetaPagination.per_page) ??
      getNumber(responsePagination.per_page) ??
      getNumber(response.per_page),
    totalItems:
      getNumber(nestedMeta.total) ??
      getNumber(nestedMetaPagination.total) ??
      getNumber(nestedPagination.total) ??
      getNumber(nestedData?.total) ??
      getNumber(responseMeta.total) ??
      getNumber(responseMetaPagination.total) ??
      getNumber(responsePagination.total) ??
      getNumber(response.total),
    totalPages:
      getNumber(nestedMeta.last_page) ??
      getNumber(nestedMetaPagination.last_page) ??
      getNumber(nestedPagination.last_page) ??
      getNumber(nestedData?.last_page) ??
      getNumber(responseMeta.last_page) ??
      getNumber(responseMetaPagination.last_page) ??
      getNumber(responsePagination.last_page) ??
      getLastPageFromLinks(
        nestedData?.links,
        nestedMeta.links,
        nestedMetaPagination.links,
        nestedPagination.links,
        response.links,
        responseMeta.links,
        responseMetaPagination.links,
        responsePagination.links,
      ) ??
      getNumber(response.last_page),
  };
}

export function buildServicesPath(params?: GetServicesParams) {
  const queryParams = new URLSearchParams();

  if (params?.name?.trim()) {
    queryParams.set("filter[name]", params.name.trim());
  }

  if (
    typeof params?.minPrice === "number" &&
    Number.isFinite(params.minPrice) &&
    params.minPrice >= 0
  ) {
    queryParams.set("filter[min_price]", String(params.minPrice));
  }

  if (
    typeof params?.maxPrice === "number" &&
    Number.isFinite(params.maxPrice) &&
    params.maxPrice >= 0
  ) {
    queryParams.set("filter[max_price]", String(params.maxPrice));
  }

  if (typeof params?.isActive === "boolean") {
    queryParams.set("filter[is_active]", String(params.isActive));
  }

  if (
    typeof params?.perPage === "number" &&
    Number.isFinite(params.perPage) &&
    params.perPage > 0
  ) {
    queryParams.set("per_page", String(params.perPage));
  }

  if (
    typeof params?.page === "number" &&
    Number.isFinite(params.page) &&
    params.page > 0
  ) {
    queryParams.set("page", String(params.page));
  }

  if (params?.sort?.trim()) {
    queryParams.set("sort", params.sort.trim());
  }

  const queryString = queryParams.toString();

  return queryString ? `service?${queryString}` : "service";
}

export function normalizeServicesResponse(
  response: ServicesApiResponse,
): GetServicesResult {
  if (Array.isArray(response.data)) {
    return {
      services: response.data,
      pagination: getPaginationMeta(response),
    };
  }

  if (isNestedServicesData(response.data)) {
    return {
      services: response.data.data,
      pagination: getPaginationMeta(response, response.data),
    };
  }

  throw new Error("Unexpected services response format.");
}

export async function getServices(
  params?: GetServicesParams,
  signal?: AbortSignal,
): Promise<GetServicesResult> {
  const path = buildServicesPath(params);

  const response = await apiRequest<ServicesApiResponse>(
    path,
    {
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeServicesResponse(response);
}
