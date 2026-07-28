const IMAGE_MEDIA_PATTERN = /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

export const ANNOUNCEMENT_MEDIA_ACCEPTED_TYPES = [
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const ACCEPTED_MEDIA_TYPES = new Set<string>(
  ANNOUNCEMENT_MEDIA_ACCEPTED_TYPES,
);

export type AnnouncementMediaValidationError =
  | "empty"
  | "tooLarge"
  | "unsupported";

export function isImageMedia(media: string) {
  return IMAGE_MEDIA_PATTERN.test(media);
}

export function isImageMediaFile(file: File) {
  return file.type.startsWith("image/");
}

export function getAnnouncementMediaValidationError(
  file: File,
  maxBytes: number,
): AnnouncementMediaValidationError | null {
  if (file.size === 0) {
    return "empty";
  }

  if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
    return "unsupported";
  }

  if (file.size > maxBytes) {
    return "tooLarge";
  }

  return null;
}
