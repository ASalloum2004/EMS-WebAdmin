import { apiRequest } from "../../../api";
import type {
  BoothApiData,
  BoothsResponse,
  GetBoothsParams,
  GetBoothsResult,
} from "../types";

export const DEFAULT_BOOTHS_PER_PAGE = 10;

const unexpectedResponseMessage = "Unexpected booths response format.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getPositiveInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return undefined;
  }

  return value;
}

function getNonNegativeInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    return undefined;
  }

  return value;
}

function isBoothApiData(value: unknown): value is BoothApiData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    typeof value.number === "string" &&
    (typeof value.qr_token === "string" || value.qr_token === null) &&
    typeof value.area === "number" &&
    Number.isFinite(value.area) &&
    typeof value.price === "string" &&
    typeof value.svg_id === "string" &&
    typeof value.created_at === "string" &&
    typeof value.is_booked === "boolean"
  );
}

export function buildBoothsPath(params: GetBoothsParams = {}) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_BOOTHS_PER_PAGE;
  const queryParams = new URLSearchParams();
  const number = params.number?.trim();

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  if (number) {
    queryParams.set("filter[number]", number);
  }

  if (params.booked !== undefined) {
    queryParams.set("filter[booked]", String(params.booked));
  }

  if (params.minArea !== undefined) {
    queryParams.set("filter[min_area]", String(params.minArea));
  }

  if (params.maxArea !== undefined) {
    queryParams.set("filter[max_area]", String(params.maxArea));
  }

  if (params.minPrice !== undefined) {
    queryParams.set("filter[min_price]", String(params.minPrice));
  }

  if (params.maxPrice !== undefined) {
    queryParams.set("filter[max_price]", String(params.maxPrice));
  }

  return `booths?${queryParams.toString()}`;
}

export function normalizeBoothsResponse(
  response: BoothsResponse,
): GetBoothsResult {
  if (
    !isRecord(response) ||
    typeof response.status !== "boolean" ||
    typeof response.message !== "string" ||
    !isRecord(response.data)
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  const responseData = response.data;
  const booths = responseData.data;
  const currentPage = getPositiveInteger(responseData.current_page);
  const perPage = getPositiveInteger(responseData.per_page);
  const totalItems = getNonNegativeInteger(responseData.total);
  const totalPages = getPositiveInteger(responseData.last_page);

  if (
    !Array.isArray(booths) ||
    !booths.every(isBoothApiData) ||
    currentPage === undefined ||
    perPage === undefined ||
    totalItems === undefined ||
    totalPages === undefined ||
    currentPage > totalPages
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  return {
    booths,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getBooths(
  params: GetBoothsParams = {},
): Promise<GetBoothsResult> {
  const response = await apiRequest<BoothsResponse>(
    buildBoothsPath(params),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeBoothsResponse(response);
}
