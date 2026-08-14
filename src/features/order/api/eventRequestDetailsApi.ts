import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
import type {
  EventRequestDetails,
  EventRequestDetailsApiData,
  EventRequestDetailsResponse,
  EventRequestOrganizerApiData,
  EventRequestOrganizerDetails,
  EventRequestSpeakerApiData,
} from "../types";

const unexpectedResponseMessage =
  "Unexpected event request details response format.";

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
    isOptionalNullableNumber(value.average_rating) &&
    isOptionalNullableNumber(value.qr_scans_count) &&
    isOptionalNullableNumber(value.saved_count) &&
    isOptionalNullableString(value.created_at) &&
    isOptionalNullableString(value.logo)
  );
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
    })),
    average_rating: details.average_rating ?? null,
    qr_scans_count: details.qr_scans_count ?? null,
    saved_count: details.saved_count ?? null,
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
