import { API_BASE_URL } from "./apiClient";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const SAFE_INLINE_IMAGE_PATTERN = /^data:image\/[a-z0-9.+-]+;base64,/i;
const API_MEDIA_REVISION_PARAM = "_ems_media_revision";

interface ResolveApiMediaUrlOptions {
  allowInlineMedia?: boolean;
}

function getApiOrigin() {
  return new URL(API_BASE_URL).origin;
}

export function resolveApiMediaUrl(
  media: string | null | undefined,
  options: ResolveApiMediaUrlOptions = {},
) {
  const trimmedMedia = media?.trim();

  if (!trimmedMedia) {
    return null;
  }

  if (
    options.allowInlineMedia &&
    SAFE_INLINE_IMAGE_PATTERN.test(trimmedMedia)
  ) {
    return trimmedMedia;
  }

  if (URL_SCHEME_PATTERN.test(trimmedMedia)) {
    if (!ABSOLUTE_HTTP_URL_PATTERN.test(trimmedMedia)) {
      return null;
    }

    try {
      return new URL(trimmedMedia).toString();
    } catch {
      return null;
    }
  }

  try {
    return new URL(
      trimmedMedia,
      `${getApiOrigin()}/`,
    ).toString();
  } catch {
    return null;
  }
}

export function removeApiMediaRevision(
  media: string | null | undefined,
) {
  const resolvedMedia = resolveApiMediaUrl(media);

  if (!resolvedMedia) {
    return null;
  }

  try {
    const url = new URL(resolvedMedia);
    url.searchParams.delete(API_MEDIA_REVISION_PARAM);
    return url.toString();
  } catch {
    return resolvedMedia;
  }
}

export function addApiMediaRevision(
  media: string | null | undefined,
  revision: string,
) {
  const resolvedMedia = resolveApiMediaUrl(media);
  const trimmedRevision = revision.trim();

  if (!resolvedMedia || !trimmedRevision) {
    return resolvedMedia;
  }

  try {
    const url = new URL(resolvedMedia);

    if (url.origin !== getApiOrigin()) {
      return resolvedMedia;
    }

    url.searchParams.set(API_MEDIA_REVISION_PARAM, trimmedRevision);
    return url.toString();
  } catch {
    return resolvedMedia;
  }
}
