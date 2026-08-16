import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  buildAllNotificationsPath,
  getAllNotifications,
} from "../src/features/notifications/api/allNotificationsApi.js";
import { markAllNotificationsRead } from "../src/features/notifications/api/markAllNotificationsReadApi.js";
import {
  buildMarkNotificationReadPath,
  markNotificationRead,
} from "../src/features/notifications/api/markNotificationReadApi.js";
import {
  buildDeleteNotificationPath,
  deleteNotification,
} from "../src/features/notifications/api/deleteNotificationApi.js";
import {
  getNotificationStatistics,
  normalizeNotificationStatisticsResponse,
} from "../src/features/notifications/api/notificationStatisticsApi.js";
import {
  DEFAULT_NOTIFICATIONS_PER_PAGE,
  MAX_NOTIFICATIONS_PER_PAGE,
  normalizeNotificationsResponse,
} from "../src/features/notifications/api/notificationApiUtils.js";
import {
  buildUnreadNotificationsPath,
  getUnreadNotifications,
} from "../src/features/notifications/api/unreadNotificationsApi.js";
import { getNotificationTarget } from "../src/features/notifications/data/notificationTargets.js";
import type {
  NotificationsListResponse,
  NotificationStatisticsResponse,
} from "../src/features/notifications/types.js";

const rawNotification = {
  body: "A new report was submitted and requires your attention.",
  created_at: "2026-08-15T09:17:15.000000Z",
  id: "367cee0e-c010-48c8-99a2-d4b0e8ffb3b8",
  read_at: null,
  target_id: "1",
  title: "New Report Received",
  type: "report_created",
};

const notificationsResponse: NotificationsListResponse = {
  data: {
    current_page: 2,
    data: [rawNotification],
    last_page: 3,
    per_page: 15,
    total: 31,
  },
  message: "Success",
  status: true,
};

const statisticsResponse: NotificationStatisticsResponse = {
  data: {
    read_notifications: 12,
    total_notifications: 31,
    unread_notifications: 19,
  },
  message: "Success",
  status: true,
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function installGeneratedAuthSession() {
  const generatedToken = `${Date.now()}-${Math.random()}`;

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: generatedToken })
          : null,
    } as Storage,
  });

  return generatedToken;
}

function getSearchParams(path: string) {
  return new URL(path, "https://ems.invalid").searchParams;
}

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (sessionStorageDescriptor) {
    Object.defineProperty(
      globalThis,
      "sessionStorage",
      sessionStorageDescriptor,
    );
  } else {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("builds all and unread paths with the documented Notification parameters", () => {
  assert.equal(DEFAULT_NOTIFICATIONS_PER_PAGE, 15);
  assert.equal(MAX_NOTIFICATIONS_PER_PAGE, 100);

  const allParams = getSearchParams(
    buildAllNotificationsPath({
      page: 3,
      perPage: 125,
      sort: " -created_at ",
      type: " report_created ",
    }),
  );
  const unreadParams = getSearchParams(
    buildUnreadNotificationsPath({
      page: 2,
      perPage: 20,
      sort: "created_at",
      type: "event_booking_request_created",
    }),
  );

  assert.equal(allParams.get("page"), "3");
  assert.equal(allParams.get("per_page"), "100");
  assert.equal(allParams.get("filter[type]"), "report_created");
  assert.equal(allParams.get("sort"), "-created_at");
  assert.equal(allParams.has("filter[status]"), false);
  assert.equal(unreadParams.get("page"), "2");
  assert.equal(unreadParams.get("per_page"), "20");
  assert.equal(
    unreadParams.get("filter[type]"),
    "event_booking_request_created",
  );
  assert.equal(unreadParams.get("sort"), "created_at");
});

test("normalizes the verified list response and derives the read status from read_at", () => {
  const result = normalizeNotificationsResponse(notificationsResponse);

  assert.deepEqual(result, {
    notifications: [
      {
        createdAt: rawNotification.created_at,
        description: rawNotification.body,
        id: rawNotification.id,
        readAt: null,
        status: "unread",
        targetId: rawNotification.target_id,
        title: rawNotification.title,
        type: rawNotification.type,
      },
    ],
    pagination: {
      currentPage: 2,
      perPage: 15,
      totalItems: 31,
      totalPages: 3,
    },
  });

  const readResult = normalizeNotificationsResponse({
    ...notificationsResponse,
    data: {
      ...notificationsResponse.data,
      data: [
        {
          ...rawNotification,
          read_at: "2026-08-15T09:30:04.000000Z",
        },
      ],
    },
  });

  assert.equal(readResult.notifications[0]?.status, "read");
  assert.equal(
    readResult.notifications[0]?.readAt,
    "2026-08-15T09:30:04.000000Z",
  );

  const numericTargetResult = normalizeNotificationsResponse({
    ...notificationsResponse,
    data: {
      ...notificationsResponse.data,
      data: [{ ...rawNotification, target_id: 1 }],
    },
  });

  assert.equal(numericTargetResult.notifications[0]?.targetId, 1);
});

test("fetches the separate list endpoints with GET and auth", async () => {
  const generatedToken = installGeneratedAuthSession();
  const requests: Array<{ init: RequestInit | undefined; url: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requests.push({ init, url });

    return new Response(JSON.stringify(notificationsResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  await getAllNotifications({ page: 2, perPage: 15, sort: "-created_at" });
  await getUnreadNotifications({
    page: 2,
    perPage: 15,
    sort: "-created_at",
  });

  assert.equal(requests.length, 2);
  assert.equal(new URL(requests[0]?.url).pathname, "/api/v1/admin/notifications");
  assert.equal(
    new URL(requests[1]?.url).pathname,
    "/api/v1/admin/notifications/unread",
  );

  requests.forEach((request) => {
    const headers = new Headers(request.init?.headers);

    assert.equal(request.init?.method, "GET");
    assert.equal(request.init?.cache, "no-store");
    assert.equal(headers.get("Authorization"), `Bearer ${generatedToken}`);
  });
});

test("uses the verified statistics response and sends notification mutations without bodies", async () => {
  const generatedToken = installGeneratedAuthSession();
  const requests: Array<{ init: RequestInit | undefined; url: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requests.push({ init, url });

    const response = url.endsWith("/statistics")
      ? statisticsResponse
      : init?.method === "DELETE"
        ? {}
        : { data: null, message: "Success", status: true };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  assert.deepEqual(
    normalizeNotificationStatisticsResponse(statisticsResponse),
    statisticsResponse.data,
  );
  await getNotificationStatistics();
  await markAllNotificationsRead();
  await markNotificationRead(rawNotification.id);
  await deleteNotification(rawNotification.id);

  assert.equal(requests.length, 4);
  assert.equal(
    new URL(requests[0]?.url).pathname,
    "/api/v1/admin/notifications/statistics",
  );
  assert.equal(
    new URL(requests[1]?.url).pathname,
    "/api/v1/admin/notifications/read-all",
  );
  assert.equal(
    new URL(requests[2]?.url).pathname,
    `/api/v1/admin/notifications/${rawNotification.id}/read`,
  );
  assert.equal(
    new URL(requests[3]?.url).pathname,
    `/api/v1/admin/notifications/${rawNotification.id}`,
  );
  assert.equal(requests[0]?.init?.method, "GET");
  assert.equal(requests[1]?.init?.method, "PATCH");
  assert.equal(requests[2]?.init?.method, "PATCH");
  assert.equal(requests[3]?.init?.method, "DELETE");
  assert.equal(requests[1]?.init?.body, undefined);
  assert.equal(requests[2]?.init?.body, undefined);
  assert.equal(requests[3]?.init?.body, undefined);
  assert.equal(
    new Headers(requests[1]?.init?.headers).get("Authorization"),
    `Bearer ${generatedToken}`,
  );
  assert.equal(
    new Headers(requests[2]?.init?.headers).get("Authorization"),
    `Bearer ${generatedToken}`,
  );
  assert.equal(
    new Headers(requests[3]?.init?.headers).get("Authorization"),
    `Bearer ${generatedToken}`,
  );
});

test("builds a safe single-read path and maps only known notification targets", () => {
  assert.equal(
    buildMarkNotificationReadPath("  notification/id  "),
    "notifications/notification%2Fid/read",
  );
  assert.equal(
    buildDeleteNotificationPath("  notification/id  "),
    "notifications/notification%2Fid",
  );

  assert.deepEqual(
    getNotificationTarget({
      ...normalizeNotificationsResponse(notificationsResponse).notifications[0]!,
      type: "report_created",
    }),
    { href: "/reports?reportId=1", id: 1 },
  );
  assert.deepEqual(
    getNotificationTarget({
      ...normalizeNotificationsResponse(notificationsResponse).notifications[0]!,
      type: "booth_booking_request_created",
    }),
    { href: "/orders?tab=booth&boothRequestId=1", id: 1 },
  );
  assert.equal(
    getNotificationTarget({
      ...normalizeNotificationsResponse(notificationsResponse).notifications[0]!,
      type: "other_notification",
    }),
    null,
  );
});
