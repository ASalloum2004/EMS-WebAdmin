import { API_BASE_URL } from "./apiClient";

const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\//i;
const URL_SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:/i;
const SAFE_INLINE_MEDIA_PATTERN =
  /^data:(?:image\/[a-z0-9.+-]+|application\/pdf);base64,/i;

interface ResolveApiMediaUrlOptions {
  allowInlineMedia?: boolean;
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
    SAFE_INLINE_MEDIA_PATTERN.test(trimmedMedia)
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
      `${new URL(API_BASE_URL).origin}/`,
    ).toString();
  } catch {
    return null;
  }
}
