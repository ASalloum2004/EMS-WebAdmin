import { apiRequest, resolveApiMediaUrl } from "../../../api";
import type {
  Announcement,
  AnnouncementActionResult,
  AnnouncementApiDto,
  AnnouncementCreateRequest,
  AnnouncementDetailsResponse,
  AnnouncementFormReceiver,
  AnnouncementFormValues,
  AnnouncementListResponse,
  AnnouncementUpdateRequest,
  AnnouncementUpdateValues,
  GetAnnouncementsParams,
  GetAnnouncementsResult,
} from "../types";

export const ANNOUNCEMENTS_PATH = "announcements";
export const DEFAULT_ANNOUNCEMENTS_PER_PAGE = 4;
export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 255;
export const ANNOUNCEMENT_DESCRIPTION_MAX_LENGTH = 2048;
export const ANNOUNCEMENT_MEDIA_MAX_LENGTH = 8192;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPositiveInteger(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : undefined;
}

function getNonNegativeInteger(value: unknown) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
    ? value
    : undefined;
}

function normalizeReceiver(receiver: string): Announcement["receiver"] {
  const normalizedReceiver = receiver.trim().toLocaleLowerCase();

  if (normalizedReceiver === "exhibitors") {
    return "exhibitors";
  }

  if (normalizedReceiver === "visitors") {
    return "visitors";
  }

  if (normalizedReceiver === "all") {
    return "all";
  }

  return "unknown";
}

function getApiReceiver(
  receiver: AnnouncementFormReceiver,
): AnnouncementCreateRequest["receiver"] {
  return receiver === "exhibitors" ? "Exhibitors" : receiver;
}

function isAnnouncementApiDto(value: unknown): value is AnnouncementApiDto {
  return (
    isRecord(value) &&
    getPositiveInteger(value.id) !== undefined &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.receiver === "string" &&
    typeof value.is_active === "boolean" &&
    (typeof value.media === "string" || value.media === null)
  );
}

export function mapAnnouncementApiDto(
  apiAnnouncement: AnnouncementApiDto,
): Announcement {
  return {
    id: apiAnnouncement.id,
    title: apiAnnouncement.title,
    description: apiAnnouncement.description,
    receiver: normalizeReceiver(apiAnnouncement.receiver),
    isDraft: apiAnnouncement.is_active,
    media: resolveApiMediaUrl(apiAnnouncement.media, {
      allowInlineMedia: true,
    }),
  };
}

export function buildAnnouncementsPath(
  params: GetAnnouncementsParams = {},
) {
  const queryParams = new URLSearchParams();
  const page = getPositiveInteger(params.page) ?? 1;
  const perPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_ANNOUNCEMENTS_PER_PAGE;
  const title = params.title?.trim();

  if (title) {
    queryParams.set("filter[title]", title);
  }

  if (params.receiver) {
    queryParams.set("filter[receiver]", getApiReceiver(params.receiver));
  }

  if (params.isDraft !== undefined) {
    queryParams.set("filter[is_active]", String(params.isDraft));
  }

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  return `${ANNOUNCEMENTS_PATH}?${queryParams.toString()}`;
}

export function normalizeAnnouncementsResponse(
  response: AnnouncementListResponse,
  requestedParams: GetAnnouncementsParams = {},
): GetAnnouncementsResult {
  if (
    !response.status ||
    !isRecord(response.data) ||
    !Array.isArray(response.data.data) ||
    !response.data.data.every(isAnnouncementApiDto)
  ) {
    throw new Error("Unexpected announcements response format.");
  }

  const announcements = response.data.data.map(mapAnnouncementApiDto);
  const currentPage =
    getPositiveInteger(response.data.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const perPage =
    getPositiveInteger(response.data.per_page) ??
    getPositiveInteger(requestedParams.perPage) ??
    DEFAULT_ANNOUNCEMENTS_PER_PAGE;
  const totalItems =
    getNonNegativeInteger(response.data.total) ?? announcements.length;
  const totalPages =
    getPositiveInteger(response.data.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    announcements,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}

export async function getAnnouncements(
  params: GetAnnouncementsParams = {},
  signal?: AbortSignal,
) {
  const response = await apiRequest<AnnouncementListResponse>(
    buildAnnouncementsPath(params),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementsResponse(response, params);
}

function buildAnnouncementPath(announcementId: number) {
  if (getPositiveInteger(announcementId) === undefined) {
    throw new Error("A valid announcement ID is required.");
  }

  return `${ANNOUNCEMENTS_PATH}/${announcementId}`;
}

export function normalizeAnnouncementDetailsResponse(
  response: AnnouncementDetailsResponse,
) {
  if (!response.status || !isAnnouncementApiDto(response.data)) {
    throw new Error("Unexpected announcement details response format.");
  }

  return mapAnnouncementApiDto(response.data);
}

export async function getAnnouncement(
  announcementId: number,
  signal?: AbortSignal,
) {
  const response = await apiRequest<AnnouncementDetailsResponse>(
    buildAnnouncementPath(announcementId),
    {
      cache: "no-store",
      method: "GET",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeAnnouncementDetailsResponse(response);
}

export function mapAnnouncementFormValuesToRequest(
  formValues: AnnouncementFormValues,
): AnnouncementCreateRequest {
  return {
    title: formValues.title.trim(),
    description: formValues.description.trim(),
    receiver: getApiReceiver(formValues.receiver),
    is_active: formValues.isDraft,
    media: formValues.media,
  };
}

export function mapAnnouncementUpdateValuesToRequest(
  formValues: AnnouncementUpdateValues,
): AnnouncementUpdateRequest {
  const request: AnnouncementUpdateRequest = {
    title: formValues.title.trim(),
    description: formValues.description.trim(),
    receiver: getApiReceiver(formValues.receiver),
    is_active: formValues.isDraft,
  };

  if (formValues.mediaUpdate === "replace") {
    request.media = formValues.media;
  } else if (formValues.mediaUpdate === "remove") {
    request.media = null;
  }

  return request;
}

function normalizeActionResponse(response: unknown): AnnouncementActionResult {
  if (!isRecord(response)) {
    return { message: "" };
  }

  if (response.status === false) {
    const message =
      typeof response.message === "string" && response.message.trim()
        ? response.message
        : "The announcement request was not completed.";

    throw new Error(message);
  }

  return {
    message:
      typeof response.message === "string" ? response.message.trim() : "",
  };
}

export async function createAnnouncement(
  formValues: AnnouncementFormValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(ANNOUNCEMENTS_PATH, {
    body: JSON.stringify(mapAnnouncementFormValuesToRequest(formValues)),
    method: "POST",
    requiresAuth: true,
    signal,
  });

  return normalizeActionResponse(response);
}

export async function updateAnnouncement(
  announcementId: number,
  formValues: AnnouncementUpdateValues,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      body: JSON.stringify(
        mapAnnouncementUpdateValuesToRequest(formValues),
      ),
      method: "PATCH",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeActionResponse(response);
}

export async function deleteAnnouncement(
  announcementId: number,
  signal?: AbortSignal,
) {
  const response = await apiRequest<unknown>(
    buildAnnouncementPath(announcementId),
    {
      method: "DELETE",
      requiresAuth: true,
      signal,
    },
  );

  return normalizeActionResponse(response);
}
