import type {
  GetNotificationsParams,
  GetNotificationsResult,
  NotificationItem,
  NotificationStatus,
  NotificationTargetId,
  NotificationsListResponse,
} from "../types";

export const DEFAULT_NOTIFICATIONS_PER_PAGE = 15;
export const MAX_NOTIFICATIONS_PER_PAGE = 100;

const unexpectedResponseMessage = "Unexpected notifications response format.";

function getPositiveInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

function getNonNegativeInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNotificationTargetId(
  value: unknown,
): value is NotificationTargetId {
  return (
    value === null ||
    (typeof value === "string" && Boolean(value.trim())) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function normalizeNotification(item: unknown): NotificationItem {
  if (
    !isRecord(item) ||
    typeof item.id !== "string" ||
    typeof item.type !== "string" ||
    typeof item.title !== "string" ||
    typeof item.body !== "string" ||
    !isNotificationTargetId(item.target_id) ||
    (item.read_at !== null && typeof item.read_at !== "string") ||
    typeof item.created_at !== "string"
  ) {
    throw new Error(unexpectedResponseMessage);
  }

  const status: NotificationStatus =
    item.read_at === null ? "unread" : "read";

  return {
    createdAt: item.created_at,
    description: item.body,
    id: item.id,
    readAt: item.read_at,
    status,
    targetId: item.target_id,
    title: item.title,
    type: item.type,
  };
}

export function buildNotificationsPath(
  endpoint: string,
  params: GetNotificationsParams = {},
) {
  const page = getPositiveInteger(params.page) ?? 1;
  const requestedPerPage =
    getPositiveInteger(params.perPage) ?? DEFAULT_NOTIFICATIONS_PER_PAGE;
  const perPage = Math.min(requestedPerPage, MAX_NOTIFICATIONS_PER_PAGE);
  const queryParams = new URLSearchParams();

  queryParams.set("page", String(page));
  queryParams.set("per_page", String(perPage));

  const type = params.type?.trim();

  if (type) {
    queryParams.set("filter[type]", type);
  }

  const sort = params.sort?.trim();

  if (sort) {
    queryParams.set("sort", sort);
  }

  return `${endpoint}?${queryParams.toString()}`;
}

export function normalizeNotificationsResponse(
  response: NotificationsListResponse,
  requestedParams: GetNotificationsParams = {},
): GetNotificationsResult {
  const responseData: unknown = isRecord(response) ? response.data : undefined;

  if (!isRecord(responseData) || !Array.isArray(responseData.data)) {
    throw new Error(unexpectedResponseMessage);
  }

  const notifications = responseData.data.map(normalizeNotification);
  const currentPage =
    getPositiveInteger(responseData.current_page) ??
    getPositiveInteger(requestedParams.page) ??
    1;
  const requestedPerPage =
    getPositiveInteger(requestedParams.perPage) ?? DEFAULT_NOTIFICATIONS_PER_PAGE;
  const perPage =
    getPositiveInteger(responseData.per_page) ??
    Math.min(requestedPerPage, MAX_NOTIFICATIONS_PER_PAGE);
  const totalItems =
    getNonNegativeInteger(responseData.total) ?? notifications.length;
  const totalPages =
    getPositiveInteger(responseData.last_page) ??
    Math.max(1, Math.ceil(totalItems / perPage));

  return {
    notifications,
    pagination: {
      currentPage,
      perPage,
      totalItems,
      totalPages,
    },
  };
}
