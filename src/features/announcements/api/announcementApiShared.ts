import type { AnnouncementActionResult } from "../types";

export const ANNOUNCEMENTS_PATH = "announcements";
export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 255;
export const ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH = 2048;
export const ANNOUNCEMENT_MEDIA_MAX_KILOBYTES = 8192;
export const ANNOUNCEMENT_MEDIA_MAX_BYTES =
  ANNOUNCEMENT_MEDIA_MAX_KILOBYTES * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildAnnouncementPath(announcementId: number) {
  if (
    !Number.isInteger(announcementId) ||
    announcementId < 1
  ) {
    throw new Error("A valid announcement ID is required.");
  }

  return `${ANNOUNCEMENTS_PATH}/${announcementId}`;
}

export function normalizeAnnouncementActionResponse(
  response: unknown,
): AnnouncementActionResult {
  if (!isRecord(response)) {
    return { message: "" };
  }

  if (response.status === false) {
    const message =
      typeof response.message === "string" && response.message.trim()
        ? response.message
        : "The announcement request was not completed.";

    throw new Error(message);
  }

  return {
    message:
      typeof response.message === "string" ? response.message.trim() : "",
  };
}
