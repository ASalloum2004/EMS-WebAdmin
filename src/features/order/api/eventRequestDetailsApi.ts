import { apiRequest } from "../../../api";
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
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullableNumber(value: unknown): value is number | null {
  return (typeof value === "number" && Number.isFinite(value)) || value === null;
}

function isValidSocialLinks(value: unknown) {
  if (value === undefined || value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    (value.website === undefined || isNullableString(value.website)) &&
    (value.linkedin === undefined || isNullableString(value.linkedin))
  );
}

function isValidOrganizer(value: unknown): value is EventRequestOrganizerApiData {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    isNullableString(value.name) &&
    isNullableString(value.business_sector) &&
    isNullableString(value.phone) &&
    isNullableString(value.description) &&
    isNullableNumber(value.year_founded) &&
    isValidSocialLinks(value.social_links) &&
    isNullableNumber(value.headquarters_lat) &&
    isNullableNumber(value.headquarters_lng) &&
    isNullableString(value.status)
  );
}

function isValidSpeaker(value: unknown): value is EventRequestSpeakerApiData {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    isNullableString(value.name)
  );
}

function isValidDetails(value: unknown): value is EventRequestDetailsApiData {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    Number.isFinite(value.id) &&
    isNullableString(value.title) &&
    isNullableNumber(value.event_hall_id) &&
    isNullableString(value.type) &&
    isNullableString(value.status) &&
    isNullableString(value.start_at) &&
    isNullableString(value.end_at) &&
    isNullableNumber(value.duration) &&
    isNullableString(value.description) &&
    isNullableString(value.qr_token) &&
    (value.eventable === null || isValidOrganizer(value.eventable)) &&
    Array.isArray(value.speakers) &&
    value.speakers.every(isValidSpeaker) &&
    isNullableNumber(value.average_rating) &&
    isNullableNumber(value.qr_scans_count) &&
    isNullableNumber(value.saved_count) &&
    isNullableString(value.created_at) &&
    isNullableString(value.logo)
  );
}

function normalizeOrganizer(
  rawOrganizer: EventRequestOrganizerApiData,
): EventRequestOrganizerDetails {
  return {
    id: rawOrganizer.id,
    name: rawOrganizer.name,
    business_sector: rawOrganizer.business_sector,
    phone: rawOrganizer.phone,
    description: rawOrganizer.description,
    year_founded: rawOrganizer.year_founded,
    social_links: rawOrganizer.social_links
      ? {
          website: rawOrganizer.social_links.website ?? null,
          linkedin: rawOrganizer.social_links.linkedin ?? null,
        }
      : null,
    status: rawOrganizer.status,
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
    start_at: details.start_at,
    end_at: details.end_at,
    duration: details.duration,
    description: details.description,
    qr_token: details.qr_token,
    eventable: details.eventable
      ? normalizeOrganizer(details.eventable)
      : null,
    speakers: details.speakers.map((speaker) => ({
      id: speaker.id,
      name: speaker.name,
    })),
    average_rating: details.average_rating,
    qr_scans_count: details.qr_scans_count,
    saved_count: details.saved_count,
    created_at: details.created_at,
    logo: details.logo,
  };
}

export async function getEventRequestDetails(
  eventRequestId: number,
): Promise<EventRequestDetails> {
  const response = await apiRequest<EventRequestDetailsResponse>(
    buildEventRequestDetailsPath(eventRequestId),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeEventRequestDetailsResponse(response);
}
