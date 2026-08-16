import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
import type {
  EventRequestDetails,
  EventRequestDetailsApiData,
  EventRequestEngagementApiData,
  EventRequestDetailsResponse,
  EventRequestOrganizerApiData,
  EventRequestOrganizerDetails,
  EventRequestSpeakerApiData,
} from "../types";

const unexpectedResponseMessage =
  "Unexpected event request details response format.";
const SPEAKER_AVATAR_KEYS = [
  "avatar",
  "avatar_url",
  "image",
  "image_url",
  "image_path",
  "photo",
  "photo_url",
  "profile_image",
  "profile_image_url",
  "profile_photo",
  "profile_photo_url",
  "media",
] as const;
const MEDIA_URL_KEYS = [
  "url",
  "original_url",
  "full_url",
  "image_url",
  "avatar_url",
  "path",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return (typeof value === "number" && Number.isFinite(value)) || value === null;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function resolveEventRequestLogoUrl(
  logo: string | null | undefined,
) {
  return resolveApiMediaUrl(logo);
}

function isOptionalNullableString(value: unknown) {
  return value === undefined || isNullableString(value);
}

function isOptionalNullableNumber(value: unknown) {
  return value === undefined || isNullableNumber(value);
}

function isOptionalMetricValue(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  );
}

function isOptionalMetricContainer(value: unknown) {
  return value === undefined || value === null || isRecord(value);
}

function isValidSocialLinks(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return (
    isRecord(value) &&
    isOptionalNullableString(value.website) &&
    isOptionalNullableString(value.linkedin)
  );
}

function isValidOrganizer(value: unknown): value is EventRequestOrganizerApiData {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    isOptionalNullableString(value.avatar) &&
    isOptionalNullableString(value.name) &&
    isOptionalNullableString(value.email) &&
    isOptionalNullableString(value.business_sector) &&
    isOptionalNullableString(value.phone) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableNumber(value.year_founded) &&
    isValidSocialLinks(value.social_links) &&
    isOptionalNullableString(value.status)
  );
}

function isValidSpeaker(value: unknown): value is EventRequestSpeakerApiData {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    isNullableString(value.name)
  );
}

function isValidSpeakers(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.every(isValidSpeaker))
  );
}

function isValidDetails(value: unknown): value is EventRequestDetailsApiData {
  return (
    isRecord(value) &&
    isPositiveInteger(value.id) &&
    isNullableString(value.title) &&
    isNullableNumber(value.event_hall_id) &&
    isNullableString(value.type) &&
    isNullableString(value.status) &&
    isOptionalNullableString(value.start_at) &&
    isOptionalNullableString(value.end_at) &&
    isOptionalNullableNumber(value.duration) &&
    isOptionalNullableString(value.description) &&
    isOptionalNullableString(value.qr_token) &&
    (value.eventable === undefined ||
      value.eventable === null ||
      isValidOrganizer(value.eventable)) &&
    isValidSpeakers(value.speakers) &&
    isOptionalMetricValue(value.average_rating) &&
    isOptionalMetricValue(value.qr_scans_count) &&
    isOptionalMetricValue(value.saved_count) &&
    isOptionalMetricContainer(value.engagement) &&
    isOptionalMetricContainer(value.statistics) &&
    isOptionalMetricContainer(value.stats) &&
    isOptionalMetricContainer(value.event) &&
    isOptionalNullableString(value.created_at) &&
    isOptionalNullableString(value.logo)
  );
}

const engagementContainerKeys = [
  "engagement",
  "statistics",
  "stats",
  "event",
] as const;

const averageRatingKeys = [
  "average_rating",
  "avg_rating",
  "ratings_avg_rating",
] as const;
const qrScansCountKeys = [
  "qr_scans_count",
  "qr_scans",
  "scans_count",
] as const;
const savedCountKeys = [
  "saved_count",
  "saves_count",
  "favorites_count",
] as const;

type EngagementMetricKey = keyof EventRequestEngagementApiData;

function getMetricSources(
  details: Record<string, unknown>,
): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = [];
  const visited = new Set<Record<string, unknown>>();

  function addNestedSources(value: unknown, depth: number) {
    if (!isRecord(value) || visited.has(value) || depth > 4) {
      return;
    }

    visited.add(value);

    for (const key of engagementContainerKeys) {
      addNestedSources(value[key], depth + 1);
    }

    sources.push(value);
  }

  for (const key of engagementContainerKeys) {
    addNestedSources(details[key], 0);
  }

  sources.push(details);

  return sources;
}

function normalizeMetricValue(value: unknown) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

function getEngagementMetric(
  sources: Record<string, unknown>[],
  keys: readonly EngagementMetricKey[],
) {
  for (const source of sources) {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        return normalizeMetricValue(source[key]);
      }
    }
  }

  return null;
}

function normalizeSocialLinks(
  socialLinks: EventRequestOrganizerApiData["social_links"],
) {
  if (!socialLinks || Array.isArray(socialLinks)) {
    return null;
  }

  return {
    website: socialLinks.website ?? null,
    linkedin: socialLinks.linkedin ?? null,
  };
}

function normalizeOrganizer(
  rawOrganizer: EventRequestOrganizerApiData,
): EventRequestOrganizerDetails {
  return {
    id: rawOrganizer.id,
    avatar: resolveEventRequestLogoUrl(rawOrganizer.avatar),
    name: rawOrganizer.name ?? null,
    email: rawOrganizer.email ?? null,
    business_sector: rawOrganizer.business_sector ?? null,
    phone: rawOrganizer.phone ?? null,
    description: rawOrganizer.description ?? null,
    year_founded: rawOrganizer.year_founded ?? null,
    social_links: normalizeSocialLinks(rawOrganizer.social_links),
    status: rawOrganizer.status ?? null,
  };
}

function resolveSpeakerAvatarUrl(value: unknown, depth = 0): string | null {
  if (typeof value === "string") {
    return resolveApiMediaUrl(value);
  }

  if (depth > 2) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = resolveSpeakerAvatarUrl(item, depth + 1);

      if (imageUrl) {
        return imageUrl;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of MEDIA_URL_KEYS) {
    const imageUrl = resolveSpeakerAvatarUrl(value[key], depth + 1);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

function getSpeakerAvatarUrl(
  speaker: EventRequestSpeakerApiData,
): string | null {
  for (const key of SPEAKER_AVATAR_KEYS) {
    const imageUrl = resolveSpeakerAvatarUrl(speaker[key]);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

export function buildEventRequestDetailsPath(eventRequestId: number) {
  if (
    !Number.isFinite(eventRequestId) ||
    eventRequestId < 1 ||
    !Number.isInteger(eventRequestId)
  ) {
    throw new Error("A valid event request ID is required.");
  }

  return `events/requests/${eventRequestId}`;
}

export function normalizeEventRequestDetailsResponse(
  response: EventRequestDetailsResponse,
): EventRequestDetails {
  const details: unknown = isRecord(response) ? response.data : undefined;

  if (!isValidDetails(details)) {
    throw new Error(unexpectedResponseMessage);
  }

  const metricSources = getMetricSources(details);

  return {
    id: details.id,
    title: details.title,
    event_hall_id: details.event_hall_id,
    type: details.type,
    status: details.status,
    start_at: details.start_at ?? null,
    end_at: details.end_at ?? null,
    duration: details.duration ?? null,
    description: details.description ?? null,
    qr_token: details.qr_token ?? null,
    eventable: details.eventable
      ? normalizeOrganizer(details.eventable)
      : null,
    speakers: (details.speakers ?? []).map((speaker) => ({
      id: speaker.id,
      name: speaker.name,
      avatar: getSpeakerAvatarUrl(speaker),
    })),
    average_rating: getEngagementMetric(metricSources, averageRatingKeys),
    qr_scans_count: getEngagementMetric(metricSources, qrScansCountKeys),
    saved_count: getEngagementMetric(metricSources, savedCountKeys),
    created_at: details.created_at ?? null,
    logo: resolveEventRequestLogoUrl(details.logo),
  };
}

export async function getEventRequestDetails(
  eventRequestId: number,
  signal?: AbortSignal,
): Promise<EventRequestDetails> {
  const response = await apiRequest<EventRequestDetailsResponse>(
    buildEventRequestDetailsPath(eventRequestId),
    {
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  return normalizeEventRequestDetailsResponse(response);
}
