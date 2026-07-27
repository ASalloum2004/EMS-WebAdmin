import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  CompanyBooth,
  CompanyBoothApiData,
  CompanyDetails,
  CompanyDetailsApiResponse,
  CompanyManager,
  CompanyManagerApiData,
} from "../types";

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeManager(manager: CompanyManagerApiData): CompanyManager {
  return {
    name: getTrimmedString(manager.name) ?? "",
    email: getTrimmedString(manager.email),
    avatar: getTrimmedString(manager.avatar),
  };
}

function normalizeBooth(booth: CompanyBoothApiData): CompanyBooth {
  return {
    number: getTrimmedString(booth.number),
    hall: getTrimmedString(booth.hall),
    label: getTrimmedString(booth.label),
  };
}

export function buildCompanyDetailsPath(companyId: number) {
  if (
    !Number.isFinite(companyId) ||
    companyId < 1 ||
    !Number.isInteger(companyId)
  ) {
    throw new Error("A valid company ID is required.");
  }

  return `companies/${companyId}`;
}

export function normalizeCompanyDetailsResponse(
  response: CompanyDetailsApiResponse,
): CompanyDetails {
  const details = response.data;

  if (
    !details ||
    typeof details !== "object" ||
    !Array.isArray(details.managers) ||
    !Array.isArray(details.booths)
  ) {
    throw new Error("Unexpected company details response format.");
  }

  return {
    id: details.id,
    name: getTrimmedString(details.name) ?? "",
    businessSector: getTrimmedString(details.business_sector) ?? "",
    phone: getTrimmedString(details.phone),
    status: getTrimmedString(details.status),
    logo: getTrimmedString(details.logo),
    managers: details.managers.map(normalizeManager),
    booths: details.booths.map(normalizeBooth),
  };
}

export async function getCompanyDetails(
  companyId: number,
  signal?: AbortSignal,
): Promise<CompanyDetails> {
  const response = await apiRequest<CompanyDetailsApiResponse>(
    buildCompanyDetailsPath(companyId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeCompanyDetailsResponse(response);
}
