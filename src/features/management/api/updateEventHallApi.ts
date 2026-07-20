import { apiRequest } from "../../../api";
import type {
  EventHall,
  UpdateEventHallPricePayload,
  UpdateEventHallResponse,
} from "../types";

function isEventHall(value: unknown): value is EventHall {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const eventHall = value as Record<string, unknown>;

  return (
    typeof eventHall.id === "number" &&
    typeof eventHall.number === "string" &&
    typeof eventHall.area === "number" &&
    typeof eventHall.price_per_hour === "string"
  );
}

export async function updateEventHallPrice(
  eventHallId: number,
  payload: UpdateEventHallPricePayload,
): Promise<EventHall | null> {
  const response = await apiRequest<UpdateEventHallResponse | null>(
    `eventHall/${eventHallId}`,
    {
      method: "PATCH",
      requiresAuth: true,
      body: JSON.stringify({
        price_per_hour: payload.pricePerHour,
      }),
    },
  );

  return isEventHall(response?.data) ? response.data : null;
}
