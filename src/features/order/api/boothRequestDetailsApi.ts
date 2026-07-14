import { apiRequest } from "../../../api";
import type {
  BoothRequestDetailsApiData,
  BoothRequestDetailsResponse,
} from "../types";

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
    !Array.isArray(details.company.gallery) ||
    !isRecord(details.company.social_links)
  ) {
    throw new Error("Unexpected booth request details response format.");
  }

  return details;
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
