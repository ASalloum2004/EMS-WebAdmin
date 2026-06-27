import { apiRequest } from "../../../api";
import type {
  AdminProfile,
  AdminProfileApiData,
  AdminProfileResponse,
} from "../types";

export function mapProfileResponse(data: AdminProfileApiData): AdminProfile {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    type: data.type,
    avatar: data.avatar,
    isVerified: data.is_verified,
  };
}

export async function getProfile(): Promise<AdminProfile> {
  const response = await apiRequest<AdminProfileResponse>("profile", {
    method: "GET",
    requiresAuth: true,
  });

  return mapProfileResponse(response.data);
}
