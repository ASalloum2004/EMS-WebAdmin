import { apiRequest } from "../../../api";
import type {
  EventHallDetails,
  EventHallDetailsResponse,
  EventHallEventApiData,
  EventHallEventDetails,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isEventHallEvent(
  value: unknown,
): value is EventHallEventApiData {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    typeof value.title === "string" &&
    isFiniteNumber(value.event_hall_id) &&
    typeof value.type === "string" &&
    typeof value.status === "string" &&
    typeof value.start_at === "string" &&
    typeof value.end_at === "string" &&
    isFiniteNumber(value.duration) &&
    typeof value.description === "string" &&
    typeof value.qr_token === "string" &&
    typeof value.created_at === "string" &&
    (typeof value.logo === "string" || value.logo === null)
  );
}

function normalizeEvent(value: unknown): EventHallEventDetails {
  if (!isEventHallEvent(value)) {
    throw new Error("Unexpected Event Hall details response format.");
  }

  return {
    id: value.id,
    title: value.title,
    event_hall_id: value.event_hall_id,
    type: value.type,
    status: value.status,
    start_at: value.start_at,
    end_at: value.end_at,
    duration: value.duration,
    description: value.description,
    created_at: value.created_at,
  };
}

export function buildEventHallDetailsPath(eventHallId: number) {
  if (
    !Number.isFinite(eventHallId) ||
    !Number.isInteger(eventHallId) ||
    eventHallId < 1
  ) {
    throw new Error("A valid Event Hall ID is required.");
  }

  return `eventHall/${eventHallId}`;
}

export function normalizeEventHallDetailsResponse(
  response: EventHallDetailsResponse,
): EventHallDetails {
  const details = response?.data;

  if (
    !isRecord(details) ||
    !isFiniteNumber(details.id) ||
    typeof details.number !== "string" ||
    !isFiniteNumber(details.area) ||
    typeof details.price_per_hour !== "string" ||
    !Array.isArray(details.events)
  ) {
    throw new Error("Unexpected Event Hall details response format.");
  }

  return {
    id: details.id,
    number: details.number,
    area: details.area,
    price_per_hour: details.price_per_hour,
    events: details.events.map(normalizeEvent),
  };
}

export async function getEventHallDetails(
  eventHallId: number,
): Promise<EventHallDetails> {
  const response = await apiRequest<EventHallDetailsResponse>(
    buildEventHallDetailsPath(eventHallId),
    {
      method: "GET",
      requiresAuth: true,
    },
  );

  return normalizeEventHallDetailsResponse(response);
}
