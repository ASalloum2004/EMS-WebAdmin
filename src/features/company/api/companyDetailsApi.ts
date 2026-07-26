import { apiRequest } from "../../../api";
import type {
  CompanyBooth,
  CompanyBoothApiData,
  CompanyDetails,
  CompanyDetailsApiResponse,
  CompanyManager,
  CompanyManagerApiData,
  CompanySocialLinks,
} from "../types";

function getTrimmedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return getTrimmedString(value);
}

function normalizeSocialLinks(
  value: CompanyDetailsApiResponse["data"]["social_links"],
): CompanySocialLinks | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const socialLinks = {
    linkedin: getTrimmedString(value.linkedin),
    website: getTrimmedString(value.website),
  };

  return socialLinks.linkedin || socialLinks.website ? socialLinks : null;
}

export function normalizeCompanyGallery(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((galleryItem) => getTrimmedString(galleryItem))
        .filter((galleryItem): galleryItem is string => Boolean(galleryItem)),
    ),
  );
}

function normalizeManager(manager: CompanyManagerApiData): CompanyManager {
  return {
    name: getTrimmedString(manager.name) ?? "",
    email: getTrimmedString(manager.email),
    avatar: getTrimmedString(manager.avatar),
    phone: getTrimmedString(manager.phone),
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
    description: getTrimmedString(details.description),
    socialLinks: normalizeSocialLinks(details.social_links),
    headquartersLat: getCoordinate(details.headquarters_lat),
    headquartersLng: getCoordinate(details.headquarters_lng),
    gallery: normalizeCompanyGallery(details.gallery),
    managers: details.managers.map(normalizeManager),
    booths: details.booths.map(normalizeBooth),
  };
}

export async function getCompanyDetails(
  companyId: number,
): Promise<CompanyDetails> {
  const response = await apiRequest<CompanyDetailsApiResponse>(
    buildCompanyDetailsPath(companyId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeCompanyDetailsResponse(response);
}
