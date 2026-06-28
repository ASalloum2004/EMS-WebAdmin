import { API_BASE_URL, apiRequest } from "../../../api";
import type {
  AdminProfile,
  AdminProfileApiData,
  AdminProfileResponse,
} from "../types";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i;

function getApiOrigin() {
  return new URL(API_BASE_URL).origin;
}

function resolveProfileAvatarUrl(avatar: string | null) {
  const trimmedAvatar = avatar?.trim();

  if (!trimmedAvatar) {
    return "";
  }

  if (ABSOLUTE_HTTP_URL_PATTERN.test(trimmedAvatar)) {
    return trimmedAvatar;
  }

  if (URL_SCHEME_PATTERN.test(trimmedAvatar)) {
    return "";
  }

  return new URL(trimmedAvatar, `${getApiOrigin()}/`).toString();
}

export function mapProfileResponse(data: AdminProfileApiData): AdminProfile {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    type: data.type,
    avatar: resolveProfileAvatarUrl(data.avatar),
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
