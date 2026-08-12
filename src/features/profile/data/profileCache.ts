import type { AdminProfile } from "../types";
import { clearProfileAvatarRevision } from "./profileAvatar";

const PROFILE_CACHE_STORAGE_KEY = "ems_admin_profile_cache";

interface CachedAdminProfile {
  profile: AdminProfile;
  sessionUserId: string;
}

function isAdminProfile(value: unknown): value is AdminProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value &&
    "type" in value &&
    "avatar" in value &&
    "isVerified" in value &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.type === "string" &&
    typeof value.avatar === "string" &&
    typeof value.isVerified === "boolean"
  );
}

function isCachedAdminProfile(value: unknown): value is CachedAdminProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    "profile" in value &&
    "sessionUserId" in value &&
    typeof value.sessionUserId === "string" &&
    isAdminProfile(value.profile)
  );
}

export function getCachedProfile(sessionUserId: string) {
  try {
    const rawCache = sessionStorage.getItem(PROFILE_CACHE_STORAGE_KEY);

    if (!rawCache) {
      return null;
    }

    const cachedValue: unknown = JSON.parse(rawCache);

    if (
      !isCachedAdminProfile(cachedValue) ||
      cachedValue.sessionUserId !== sessionUserId
    ) {
      clearProfileSessionCache();
      return null;
    }

    return cachedValue.profile;
  } catch {
    clearProfileSessionCache();
    return null;
  }
}

export function setCachedProfile(
  sessionUserId: string,
  profile: AdminProfile,
) {
  try {
    sessionStorage.setItem(
      PROFILE_CACHE_STORAGE_KEY,
      JSON.stringify({ profile, sessionUserId } satisfies CachedAdminProfile),
    );
  } catch {
    // The mounted provider remains the source of truth when storage is unavailable.
  }
}

export function clearProfileSessionCache() {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures while clearing the in-memory authenticated session.
  }

  clearProfileAvatarRevision();
}
