import { apiRequest } from "../../../api";
import type {
  AdminProfile,
  AdminProfileUpdatePayload,
  AdminProfileUpdateResponse,
} from "../types";
import { mapProfileResponse } from "./profileShowApi";

export async function updateProfile(
  payload: AdminProfileUpdatePayload,
): Promise<AdminProfile> {
  const formData = new FormData();

  if (payload.name) {
    formData.append("name", payload.name);
  }

  if (payload.avatar instanceof File) {
    formData.append("avatar", payload.avatar, payload.avatar.name);
  }

  const response = await apiRequest<AdminProfileUpdateResponse>("profile", {
    method: "POST",
    requiresAuth: true,
    body: formData,
  });

  return mapProfileResponse(response.data);
}
