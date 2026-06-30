import { apiRequest } from "../../../api";
import type {
  BoothApiData,
  UpdateBoothPayload,
  UpdateBoothResponse,
} from "../types";

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
