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
