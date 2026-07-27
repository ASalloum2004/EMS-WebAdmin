import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type {
  EventHall,
  EventHallsResponse,
  GetEventHallsParams,
} from "../types";

function setNumberFilter(
  queryParams: URLSearchParams,
  key: string,
  value: number | undefined,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    queryParams.set(key, String(value));
  }
}

export function buildEventHallsPath(params?: GetEventHallsParams) {
  const queryParams = new URLSearchParams();

  setNumberFilter(queryParams, "filter[min_area]", params?.minArea);
  setNumberFilter(queryParams, "filter[max_area]", params?.maxArea);
  setNumberFilter(queryParams, "filter[min_price]", params?.minPrice);
  setNumberFilter(queryParams, "filter[max_price]", params?.maxPrice);

  const queryString = queryParams.toString();

  return queryString ? `eventHall?${queryString}` : "eventHall";
}

export async function getEventHalls(
  params?: GetEventHallsParams,
  signal?: AbortSignal,
): Promise<EventHall[]> {
  const response = await apiRequest<EventHallsResponse>(
    buildEventHallsPath(params),
    {
      method: "GET",
      requiresAuth: true,
      signal,
      timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
    },
  );

  if (!response || !Array.isArray(response.data)) {
    throw new Error("Unexpected event halls response format.");
  }

  return response.data;
}
