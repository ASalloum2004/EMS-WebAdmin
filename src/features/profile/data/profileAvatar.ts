import {
  addApiMediaRevision,
  removeApiMediaRevision,
} from "../../../api";
import type { AdminProfile } from "../types";

export const PROFILE_AVATAR_MAX_KILOBYTES = 4096;
export const PROFILE_AVATAR_MAX_BYTES =
  PROFILE_AVATAR_MAX_KILOBYTES * 1024;

export const PROFILE_AVATAR_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const ACCEPTED_AVATAR_TYPES = new Set<string>(
  PROFILE_AVATAR_ACCEPTED_TYPES,
);
const PROFILE_AVATAR_REVISION_STORAGE_KEY =
  "ems_profile_avatar_revision";

interface StoredProfileAvatarRevision {
  profileId: number;
  revision: string;
  sourceUrl: string;
}

let revisionSequence = 0;

export type ProfileAvatarValidationError =
  | "avatarEmpty"
  | "avatarTooLarge"
  | "avatarUnsupported";

export function getProfileAvatarValidationError(
  file: File,
): ProfileAvatarValidationError | null {
  if (file.size === 0) {
    return "avatarEmpty";
  }

  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    return "avatarUnsupported";
  }

  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return "avatarTooLarge";
  }

  return null;
}

function readStoredProfileAvatarRevision() {
  try {
    const rawRevision = sessionStorage.getItem(
      PROFILE_AVATAR_REVISION_STORAGE_KEY,
    );

    if (!rawRevision) {
      return null;
    }

    const value: unknown = JSON.parse(rawRevision);

    if (
      typeof value !== "object" ||
      value === null ||
      !("profileId" in value) ||
      !("revision" in value) ||
      !("sourceUrl" in value) ||
      typeof value.profileId !== "number" ||
      typeof value.revision !== "string" ||
      typeof value.sourceUrl !== "string"
    ) {
      return null;
    }

    return value as StoredProfileAvatarRevision;
  } catch {
    return null;
  }
}

function writeStoredProfileAvatarRevision(
  revision: StoredProfileAvatarRevision,
) {
  try {
    sessionStorage.setItem(
      PROFILE_AVATAR_REVISION_STORAGE_KEY,
      JSON.stringify(revision),
    );
  } catch {
    // The in-memory profile still carries the revision when storage is unavailable.
  }
}

function clearStoredProfileAvatarRevision(profileId: number) {
  const storedRevision = readStoredProfileAvatarRevision();

  if (storedRevision?.profileId !== profileId) {
    return;
  }

  try {
    sessionStorage.removeItem(PROFILE_AVATAR_REVISION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function clearProfileAvatarRevision() {
  try {
    sessionStorage.removeItem(PROFILE_AVATAR_REVISION_STORAGE_KEY);
  } catch {
    // Ignore storage failures while clearing the authenticated profile cache.
  }
}

export function createProfileAvatarRevision() {
  revisionSequence += 1;
  return `${Date.now().toString(36)}-${revisionSequence.toString(36)}`;
}

export function applyStoredProfileAvatarRevision(
  profile: AdminProfile,
): AdminProfile {
  const sourceUrl = removeApiMediaRevision(profile.avatar);
  const storedRevision = readStoredProfileAvatarRevision();

  if (!sourceUrl || !storedRevision) {
    return profile;
  }

  if (
    storedRevision.profileId !== profile.id ||
    storedRevision.sourceUrl !== sourceUrl
  ) {
    clearStoredProfileAvatarRevision(profile.id);
    return profile;
  }

  return {
    ...profile,
    avatar:
      addApiMediaRevision(sourceUrl, storedRevision.revision) ??
      profile.avatar,
  };
}

export function applyUploadedProfileAvatarRevision(
  previousProfile: AdminProfile | null,
  updatedProfile: AdminProfile,
  revision: string,
): AdminProfile {
  const previousSourceUrl = removeApiMediaRevision(previousProfile?.avatar);
  const updatedSourceUrl = removeApiMediaRevision(updatedProfile.avatar);

  if (!updatedSourceUrl || previousSourceUrl !== updatedSourceUrl) {
    clearStoredProfileAvatarRevision(updatedProfile.id);
    return updatedProfile;
  }

  const revisedAvatarUrl = addApiMediaRevision(updatedSourceUrl, revision);

  if (!revisedAvatarUrl || revisedAvatarUrl === updatedSourceUrl) {
    clearStoredProfileAvatarRevision(updatedProfile.id);
    return updatedProfile;
  }

  writeStoredProfileAvatarRevision({
    profileId: updatedProfile.id,
    revision,
    sourceUrl: updatedSourceUrl,
  });

  return {
    ...updatedProfile,
    avatar: revisedAvatarUrl,
  };
}
