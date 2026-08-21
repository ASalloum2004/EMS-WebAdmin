import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
import type {
    BoothRequestDetailsApiData,
  BoothRequestDetailsResponse,
  BoothRequestService,
  BoothRequestStatus,

} from "../types";
import { getTrimmedString } from "../utils/getTrimmedString";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getServiceId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

function getServiceAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

const SERVICE_NAME_KEYS = ["name", "service_name", "title", "label"];
const SERVICE_CONTAINER_KEYS = [
  "service",
  "service_details",
  "details",
  "data",
];
const GALLERY_MEDIA_KEYS = [
  "url",
  "image_url",
  "image_path",
  "original_url",
  "full_url",
  "path",
  "image",
  "file",
  "src",
];
const GALLERY_MEDIA_CONTAINER_KEYS = ["media", "attachment", "data"];

function getServiceName(value: unknown, depth = 0): string {
  const stringValue = getTrimmedString(value);

  if (stringValue || depth > 4) {
    return stringValue;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const itemName = getServiceName(item, depth + 1);

      if (itemName) {
        return itemName;
      }
    }

    return "";
  }

  if (!isRecord(value)) {
    return "";
  }

  for (const key of SERVICE_NAME_KEYS) {
    const name = getServiceName(value[key], depth + 1);

    if (name) {
      return name;
    }
  }

  for (const key of SERVICE_CONTAINER_KEYS) {
    const name = getServiceName(value[key], depth + 1);

    if (name) {
      return name;
    }
  }

  for (const nestedValue of Object.values(value)) {
    if (!isRecord(nestedValue)) {
      continue;
    }

    const name = getServiceName(nestedValue, depth + 1);

    if (name) {
      return name;
    }
  }

  return "";
}

function getNormalizedServiceId(requestService: unknown) {
  if (!isRecord(requestService)) {
    return null;
  }

  const nestedServiceId = isRecord(requestService.service)
    ? getServiceId(requestService.service.id)
    : null;

  return (
    getServiceId(requestService.service_id) ??
    nestedServiceId ??
    getServiceId(requestService.id)
  );
}

function normalizeBoothRequestServices(
  services: BoothRequestDetailsResponse["data"]["services"],
): BoothRequestService[] {
  return services.map((requestService) => {
    const serviceData = isRecord(requestService) ? requestService : {};

    return {
      id: getNormalizedServiceId(requestService),
      name: getServiceName(requestService),
      quantity: getServiceAmount(serviceData.quantity),
      unit_price: getServiceAmount(serviceData.unit_price),
      total_price: getServiceAmount(serviceData.total_price),
    };
  });
}

function getGalleryImageUrl(value: unknown, depth = 0): string | null {
  if (typeof value === "string") {
    return resolveApiMediaUrl(value);
  }

  if (depth > 2 || !isRecord(value)) {
    return null;
  }

  for (const key of GALLERY_MEDIA_KEYS) {
    const url = getGalleryImageUrl(value[key], depth + 1);

    if (url) {
      return url;
    }
  }

  for (const key of GALLERY_MEDIA_CONTAINER_KEYS) {
    const nestedValue = value[key];

    if (Array.isArray(nestedValue)) {
      for (const item of nestedValue) {
        const url = getGalleryImageUrl(item, depth + 1);

        if (url) {
          return url;
        }
      }
    } else {
      const url = getGalleryImageUrl(nestedValue, depth + 1);

      if (url) {
        return url;
      }
    }
  }

  return null;
}

function normalizeBoothRequestStatus(value: unknown): BoothRequestStatus {
  const status = getTrimmedString(value).toLowerCase();

  if (status === "cancelled") {
    return "cancelled";
  }

  return status as BoothRequestStatus;
}

function normalizeCompanyGallery(gallery: unknown): string[] {

  if (!Array.isArray(gallery)) {
    return [];
  }

  const imageUrls = gallery
    .map((item) => getGalleryImageUrl(item))
    .filter((url): url is string => Boolean(url));

  return [...new Set(imageUrls)];
}

export function buildBoothRequestDetailsPath(boothRequestId: number) {
  if (
    !Number.isFinite(boothRequestId) ||
    boothRequestId < 1 ||
    !Number.isInteger(boothRequestId)
  ) {
    throw new Error("A valid booth request ID is required.");
  }

  return `booths/requests/${boothRequestId}`;
}

export function normalizeBoothRequestDetailsResponse(
  response: BoothRequestDetailsResponse,
): BoothRequestDetailsApiData {
  const details = response.data;

  if (
    !isRecord(details) ||
    !Array.isArray(details.services) ||
    !isRecord(details.company)
  ) {
    throw new Error("Unexpected booth request details response format.");
  }

  return {
        ...details,
    status: normalizeBoothRequestStatus(details.status),
    company: {

      ...details.company,
      business_sector: getTrimmedString(details.company.business_sector),
      description: getTrimmedString(details.company.description),
      gallery: normalizeCompanyGallery(details.company.gallery),
      logo: resolveApiMediaUrl(details.company.logo) ?? "",
      name: getTrimmedString(details.company.name),
      phone: getTrimmedString(details.company.phone),
      social_links: {
        linkedin: getTrimmedString(
          details.company.social_links?.linkedin,
        ),
        website: getTrimmedString(details.company.social_links?.website),
      },
      status: getTrimmedString(details.company.status),
    },
    created_at: getTrimmedString(details.created_at),
    reason_for_booking: getTrimmedString(details.reason_for_booking),
    services: normalizeBoothRequestServices(details.services),
  };
}

export async function getBoothRequestDetails(
  boothRequestId: number,
  signal?: AbortSignal,
): Promise<BoothRequestDetailsApiData> {
  const response = await apiRequest<BoothRequestDetailsResponse>(
    buildBoothRequestDetailsPath(boothRequestId),
    {
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeBoothRequestDetailsResponse(response);
}
