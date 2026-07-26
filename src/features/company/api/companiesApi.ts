import { apiRequest } from "../../../api";
import type {
  CompaniesApiResponse,
  CompanyListApiData,
  CompanyListItem,
  GetCompaniesParams,
  GetCompaniesResult,
} from "../types";

export const COMPANIES_PATH = "companies";
export const DEFAULT_COMPANIES_PER_PAGE = 15;

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

function normalizeCompanyListItem(
  company: CompanyListApiData,
): CompanyListItem {
  return {
    id: company.id,
    name: getTrimmedString(company.name) ?? "",
    businessSector: getTrimmedString(company.business_sector) ?? "",
    phone: getTrimmedString(company.phone),
    status: getTrimmedString(company.status),
    logo: getTrimmedString(company.logo),
  };
}

export function buildCompaniesPath(params: GetCompaniesParams = {}) {
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_COMPANIES_PER_PAGE;
  const queryParams = new URLSearchParams();
  const name = params.name?.trim();
  const businessSector = params.businessSector?.trim();

  if (name) {
    queryParams.set("filter[name]", name);
  }

  if (businessSector) {
    queryParams.set("filter[business_sector]", businessSector);
  }

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  return `${COMPANIES_PATH}?${queryParams.toString()}`;
}

export function normalizeCompaniesResponse(
  response: CompaniesApiResponse,
  requestedParams: GetCompaniesParams = {},
): GetCompaniesResult {
  if (
    !response.data ||
    typeof response.data !== "object" ||
    !Array.isArray(response.data.data)
  ) {
    throw new Error("Unexpected companies response format.");
  }

  const companies = response.data.data.map(normalizeCompanyListItem);
  const currentPage =
    getPositiveInteger(response.data.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(response.data.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_COMPANIES_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(response.data.total) ?? companies.length;
  const totalPages =
    getPositiveInteger(response.data.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    companies,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getCompanies(
  params: GetCompaniesParams = {},
): Promise<GetCompaniesResult> {
  const response = await apiRequest<CompaniesApiResponse>(
    buildCompaniesPath(params),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeCompaniesResponse(response, params);
}
