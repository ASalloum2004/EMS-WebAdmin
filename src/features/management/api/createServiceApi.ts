import { apiRequest } from "../../../api";
import type {
  CreateServicePayload,
  ServiceApiData,
  ServiceResponse,
} from "../types";

export async function createService(
  payload: CreateServicePayload,
): Promise<ServiceApiData> {
  const response = await apiRequest<ServiceResponse>("service", {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify({
      name: payload.name,
      price: payload.price,
    }),
  });

  return response.data;
}
