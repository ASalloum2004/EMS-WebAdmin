import { resolveApiMediaUrl } from "../../../api";
import type {
  Announcement,
  AnnouncementApiDto,
  AnnouncementFormReceiver,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

function normalizeReceiver(receiver: string): Announcement["receiver"] {
  const normalizedReceiver = receiver.trim().toLocaleLowerCase();

  if (normalizedReceiver === "exhibitors") {
    return "exhibitors";
  }

  if (normalizedReceiver === "visitors") {
    return "visitors";
  }

  if (normalizedReceiver === "all") {
    return "all";
  }

  return "unknown";
}

export function getAnnouncementApiReceiver(
  receiver: AnnouncementFormReceiver,
): "Exhibitors" | "visitors" | "all" {
  return receiver === "exhibitors" ? "Exhibitors" : receiver;
}

export function isAnnouncementApiDto(
  value: unknown,
): value is AnnouncementApiDto {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.receiver === "string" &&
    typeof value.is_active === "boolean" &&
    (typeof value.media === "string" || value.media === null)
  );
}

export function mapAnnouncementApiDto(
  apiAnnouncement: AnnouncementApiDto,
): Announcement {
  return {
    id: apiAnnouncement.id,
    title: apiAnnouncement.title,
    description: apiAnnouncement.description,
    receiver: normalizeReceiver(apiAnnouncement.receiver),
    isDraft: apiAnnouncement.is_active,
    media: resolveApiMediaUrl(apiAnnouncement.media, {
      allowInlineMedia: true,
    }),
  };
}
