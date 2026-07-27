import { apiRequest, CONTENT_REQUEST_TIMEOUT_MS } from "../../../api";
import type { HallApiData, HallsResponse } from "../types";

type NestedHallsResponse = Omit<HallsResponse, "data"> & {
  data: {
    data: HallApiData[];
  };
};

type HallsApiResponse = HallsResponse | NestedHallsResponse;

function isNestedHallsData(
  value: HallsApiResponse["data"],
): value is NestedHallsResponse["data"] {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data)
  );
}

export async function getHalls(signal?: AbortSignal): Promise<HallApiData[]> {
  const response = await apiRequest<HallsApiResponse>("halls", {
    method: "GET",
    requiresAuth: true,
    signal,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (isNestedHallsData(response.data)) {
    return response.data.data;
  }

  throw new Error("Unexpected halls response format.");
}
