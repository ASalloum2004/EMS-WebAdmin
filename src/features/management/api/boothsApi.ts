import { apiRequest } from "../../../api";
import type {
  BoothApiData,
  BoothsResponse,
  GetBoothsParams,
  UpdateBoothPayload,
  UpdateBoothResponse,
} from "../types";

type NestedBoothsResponse = Omit<BoothsResponse, "data"> & {
  data: {
    data: BoothApiData[];
  };
};

type BoothsApiResponse = BoothsResponse | NestedBoothsResponse;

function isNestedBoothsData(
  value: BoothsApiResponse["data"],
): value is NestedBoothsResponse["data"] {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data)
  );
}

function getBoothsPath(params: GetBoothsParams = {}) {
  if (params.booked === true) {
    return "booths?filter[booked]=true";
  }

  if (params.booked === false) {
    return "booths?filter[booked]=false";
  }

  return "booths";
}

export async function getBooths(
  params: GetBoothsParams = {},
): Promise<BoothApiData[]> {
  const response = await apiRequest<BoothsApiResponse>(getBoothsPath(params), {
    method: "GET",
    requiresAuth: true,
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (isNestedBoothsData(response.data)) {
    return response.data.data;
  }

  throw new Error("Unexpected booths response format.");
}

export async function updateBooth(
  boothId: number,
  payload: UpdateBoothPayload,
): Promise<BoothApiData> {
  const response = await apiRequest<UpdateBoothResponse>(`booths/${boothId}`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify({
      number: payload.number,
      area: payload.area,
      price: payload.price,
    }),
  });

  return response.data;
}
