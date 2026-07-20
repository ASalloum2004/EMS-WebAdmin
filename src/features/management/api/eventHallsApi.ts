import { apiRequest } from "../../../api";
import type { EventHall, EventHallsResponse } from "../types";

export async function getEventHalls(): Promise<EventHall[]> {
  const response = await apiRequest<EventHallsResponse>("eventHall", {
    method: "GET",
    requiresAuth: true,
  });

  if (!response || !Array.isArray(response.data)) {
    throw new Error("Unexpected event halls response format.");
  }

  return response.data;
}
