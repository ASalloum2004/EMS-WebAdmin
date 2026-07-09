import { apiRequest } from "../../../api";
import type {
  ServiceApiData,
  ServiceResponse,
  UpdateServicePayload,
} from "../types";

export async function updateService(
  serviceId: number,
  payload: UpdateServicePayload,
): Promise<ServiceApiData> {
  const response = await apiRequest<ServiceResponse>(`service/${serviceId}`, {
    method: "PUT",
    requiresAuth: true,
    body: JSON.stringify({
      name: payload.name,
      price: payload.price,
      is_active: payload.is_active,
    }),
  });

  return response.data;
}
