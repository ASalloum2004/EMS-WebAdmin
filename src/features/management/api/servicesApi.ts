import { apiRequest } from "../../../api";
import type {
  GetServicesParams,
  GetServicesResult,
  PaginationMeta,
  ServiceApiData,
  ServicesResponse,
} from "../types";

type NestedServicesData = {
  data: ServiceApiData[];
  links?: Record<string, unknown>;
  meta?: PaginationMeta;
  current_page?: number | string;
  per_page?: number | string;
  total?: number | string;
  last_page?: number | string;
};

type NestedServicesResponse = Omit<ServicesResponse, "data"> & {
  data: NestedServicesData;
};

type ServicesApiResponse = ServicesResponse | NestedServicesResponse;

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

function getPaginationMeta(
  response: ServicesApiResponse,
  nestedData?: NestedServicesData,
): PaginationMeta {
  const responseMeta: Record<string, unknown> = isRecord(response.meta)
    ? response.meta
    : {};
  const nestedMeta: Record<string, unknown> = isRecord(nestedData?.meta)
    ? nestedData.meta
    : {};

  return {
    current_page:
      getNumber(nestedMeta.current_page) ??
      getNumber(nestedData?.current_page) ??
      getNumber(responseMeta.current_page) ??
      getNumber(response.current_page),
    per_page:
      getNumber(nestedMeta.per_page) ??
      getNumber(nestedData?.per_page) ??
      getNumber(responseMeta.per_page) ??
      getNumber(response.per_page),
    total:
      getNumber(nestedMeta.total) ??
      getNumber(nestedData?.total) ??
      getNumber(responseMeta.total) ??
      getNumber(response.total),
    last_page:
      getNumber(nestedMeta.last_page) ??
      getNumber(nestedData?.last_page) ??
      getNumber(responseMeta.last_page) ??
      getNumber(response.last_page),
  };
}

function buildServicesPath(params?: GetServicesParams) {
  const queryParams = new URLSearchParams();

  if (params?.name?.trim()) {
    queryParams.set("filter[name]", params.name.trim());
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

export async function getServices(
  params?: GetServicesParams,
): Promise<GetServicesResult> {
  const response = await apiRequest<ServicesApiResponse>(
    buildServicesPath(params),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

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
