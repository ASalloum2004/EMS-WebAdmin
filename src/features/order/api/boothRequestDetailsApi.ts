import { apiRequest } from "../../../api";
import type {
  BoothRequestDetailsApiData,
  BoothRequestDetailsResponse,
} from "../types";
import { getTrimmedString } from "../utils/getTrimmedString";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    !isRecord(details.company) ||
    !Array.isArray(details.company.gallery)
  ) {
    throw new Error("Unexpected booth request details response format.");
  }

  return {
    ...details,
    company: {
      ...details.company,
      business_sector: getTrimmedString(details.company.business_sector),
      description: getTrimmedString(details.company.description),
      logo: getTrimmedString(details.company.logo),
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
  };
}

export async function getBoothRequestDetails(
  boothRequestId: number,
): Promise<BoothRequestDetailsApiData> {
  const response = await apiRequest<BoothRequestDetailsResponse>(
    buildBoothRequestDetailsPath(boothRequestId),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeBoothRequestDetailsResponse(response);
}
