import { apiRequest } from "../../../api";
import {
  isAnnouncementApiDto,
  mapAnnouncementApiDto,
} from "../mappers";
import { buildAnnouncementPath } from "./announcementApiShared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeAnnouncementDetailsResponse(response: unknown) {
  if (!isRecord(response)) {
    throw new Error("Unexpected announcement details response format.");
  }

  if (response.status === false) {
    throw new Error(
      typeof response.message === "string" && response.message.trim()
        ? response.message
        : "The announcement could not be loaded.",
    );
  }

  if (response.status !== true || !isAnnouncementApiDto(response.data)) {
    throw new Error("Unexpected announcement details response format.");
  }

  return mapAnnouncementApiDto(response.data);
}

export async function getAnnouncement(
  announcementId: number,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementDetailsResponse(response);
}
