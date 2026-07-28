import {
  apiRequest,
  CONTENT_REQUEST_TIMEOUT_MS,
  resolveApiMediaUrl,
} from "../../../api";
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
    avatar: resolveApiMediaUrl(data.avatar) ?? "",
    isVerified: data.is_verified,
  };
}

export async function getProfile(signal?: AbortSignal): Promise<AdminProfile> {
  const response = await apiRequest<AdminProfileResponse>("profile", {
    method: "GET",
    requiresAuth: true,
    signal,
    timeoutMs: CONTENT_REQUEST_TIMEOUT_MS,
  });

  return mapProfileResponse(response.data);
}
