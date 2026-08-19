import { apiRequest } from "../../../api";
import {
  getAnnouncementApiReceiver,
  isAnnouncementApiDto,
  mapAnnouncementApiDto,
} from "../mappers";
import type {
  GetAnnouncementsParams,
  GetAnnouncementsResult,
} from "../types";
import { ANNOUNCEMENTS_PATH } from "./announcementApiShared";

export const DEFAULT_ANNOUNCEMENTS_PER_PAGE = 4;
export const ANNOUNCEMENTS_LIST_TIMEOUT_MS = 12_000;

export class AnnouncementListTimeoutError extends Error {
  constructor() {
    super("The announcements request timed out.");
    this.name = "AnnouncementListTimeoutError";
  }
}

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
    queryParams.set(
      "filter[receiver]",
      getAnnouncementApiReceiver(params.receiver),
    );
  }

  if (params.isActive !== undefined) {
    queryParams.set("filter[is_active]", String(params.isActive));
  }

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  return `${ANNOUNCEMENTS_PATH}?${queryParams.toString()}`;
}

export function normalizeAnnouncementsResponse(
  response: unknown,
  requestedParams: GetAnnouncementsParams = {},
): GetAnnouncementsResult {
  if (!isRecord(response)) {
    throw new Error("Unexpected announcements response format.");
  }

  if (response.status === false) {
    throw new Error(
      typeof response.message === "string" && response.message.trim()
        ? response.message
        : "The announcements could not be loaded.",
    );
  }

  if (
    response.status !== true ||
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
  timeoutMs = ANNOUNCEMENTS_LIST_TIMEOUT_MS,
) {
  const requestController = new AbortController();
  let didTimeout = false;
  const abortFromCaller = () => requestController.abort();

  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timeoutId = globalThis.setTimeout(() => {
    didTimeout = true;
    requestController.abort();
  }, timeoutMs);

  try {
    const response = await apiRequest<unknown>(
      buildAnnouncementsPath(params),
      {
        cache: "no-store",
        method: "GET",
        requiresAuth: true,
        signal: requestController.signal,
      },
    );

    return normalizeAnnouncementsResponse(response, params);
  } catch (error) {
    if (didTimeout) {
      throw new AnnouncementListTimeoutError();
    }

    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
