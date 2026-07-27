import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  AnnouncementListTimeoutError,
  buildAnnouncementsPath,
  getAnnouncements,
  normalizeAnnouncementsResponse,
} from "../src/features/announcements/api/announcementsApi.js";
import { normalizeAnnouncementDetailsResponse } from "../src/features/announcements/api/announcementDetailsApi.js";
import { createAnnouncement } from "../src/features/announcements/api/createAnnouncementApi.js";
import { mapAnnouncementUpdateValuesToRequest } from "../src/features/announcements/mappers/announcementMapper.js";
import type {
  AnnouncementDetailsResponse,
  AnnouncementListResponse,
} from "../src/features/announcements/types.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

const apiAnnouncement = {
  id: 17,
  title: "Backend Announcement",
  description: "Loaded from the API.",
  receiver: "Exhibitors",
  is_active: true,
  media: "/storage/announcement.png",
};

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: window.sessionStorage,
  });
  window.sessionStorage.setItem(
    "auth_session",
    JSON.stringify({
      token: "announcement-test-token",
      user: {
        email: "admin@example.com",
        id: "1",
        name: "Test Admin",
        role: "admin",
      },
    }),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  window.sessionStorage.clear();

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

test("builds only documented announcement filters and preserves false", () => {
  const requestUrl = new URL(
    buildAnnouncementsPath({
      isDraft: false,
      page: 3,
      perPage: 4,
      receiver: "exhibitors",
      title: "  Welcome  ",
    }),
    "https://ems.test/api/",
  );

  assert.equal(requestUrl.pathname, "/api/announcements");
  assert.equal(requestUrl.searchParams.get("filter[title]"), "Welcome");
  assert.equal(
    requestUrl.searchParams.get("filter[receiver]"),
    "Exhibitors",
  );
  assert.equal(requestUrl.searchParams.get("filter[is_active]"), "false");
  assert.equal(requestUrl.searchParams.get("page"), "3");
  assert.equal(requestUrl.searchParams.get("per_page"), "4");

  const unfilteredUrl = new URL(
    buildAnnouncementsPath(),
    "https://ems.test/api/",
  );
  assert.equal(unfilteredUrl.searchParams.has("filter[is_active]"), false);
});

test("normalizes the nested list response and maps is_active to isDraft", () => {
  const response: AnnouncementListResponse = {
    status: true,
    message: "Announcements retrieved successfully.",
    data: {
      data: [apiAnnouncement],
      current_page: 2,
      per_page: 4,
      total: 9,
      last_page: 3,
    },
  };

  const result = normalizeAnnouncementsResponse(response);

  assert.equal(result.announcements[0]?.isDraft, true);
  assert.equal(result.announcements[0]?.receiver, "exhibitors");
  assert.equal(
    result.announcements[0]?.media,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/announcement.png",
  );
  assert.deepEqual(result.pagination, {
    currentPage: 2,
    perPage: 4,
    totalItems: 9,
    totalPages: 3,
  });
});

test("normalizes details and safely falls back for unsupported receivers", () => {
  const response: AnnouncementDetailsResponse = {
    status: true,
    message: "Announcement retrieved successfully.",
    data: {
      ...apiAnnouncement,
      receiver: "unexpected-audience",
      is_active: false,
      media: null,
    },
  };

  const announcement = normalizeAnnouncementDetailsResponse(response);

  assert.equal(announcement.receiver, "unknown");
  assert.equal(announcement.isDraft, false);
  assert.equal(announcement.media, null);
});

test("create uses authenticated JSON with the exact backend field mapping", async () => {
  const requests: Array<{ init?: RequestInit; url: string }> = [];

  globalThis.fetch = async (input, init) => {
    requests.push({
      init,
      url:
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
    });

    return new Response(
      JSON.stringify({ status: true, message: "Announcement created." }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  };

  const result = await createAnnouncement({
    title: "  Draft notice  ",
    description: "  Saved for later.  ",
    receiver: "exhibitors",
    isDraft: true,
    media: null,
  });

  const request = requests[0];
  assert.ok(request);
  assert.equal(request.url.endsWith("/api/v1/admin/announcements"), true);
  assert.equal(request.init?.method, "POST");
  const headers = new Headers(request.init?.headers);
  assert.equal(headers.get("Authorization"), "Bearer announcement-test-token");
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.deepEqual(JSON.parse(String(request.init?.body)), {
    title: "Draft notice",
    description: "Saved for later.",
    receiver: "Exhibitors",
    is_active: true,
    media: null,
  });
  assert.equal(result.message, "Announcement created.");
});

test("update omits preserved media and sends null only for removal", () => {
  const baseValues = {
    title: "Announcement",
    description: "Description",
    receiver: "visitors" as const,
    isDraft: false,
    media: "data:image/png;base64,abc",
  };

  assert.deepEqual(
    mapAnnouncementUpdateValuesToRequest({
      ...baseValues,
      mediaUpdate: "preserve",
    }),
    {
      title: "Announcement",
      description: "Description",
      receiver: "visitors",
      is_active: false,
    },
  );

  assert.deepEqual(
    mapAnnouncementUpdateValuesToRequest({
      ...baseValues,
      media: null,
      mediaUpdate: "remove",
    }),
    {
      title: "Announcement",
      description: "Description",
      receiver: "visitors",
      is_active: false,
      media: null,
    },
  );
});

test("list requests time out instead of remaining pending indefinitely", async () => {
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      const rejectAbort = () =>
        reject(new DOMException("The request was aborted.", "AbortError"));

      if (signal?.aborted) {
        rejectAbort();
        return;
      }

      signal?.addEventListener("abort", rejectAbort, { once: true });
    });

  await assert.rejects(
    () => getAnnouncements({}, undefined, 10),
    AnnouncementListTimeoutError,
  );
});

test("status false list responses expose the backend error", () => {
  assert.throws(
    () =>
      normalizeAnnouncementsResponse({
        status: false,
        message: "Announcements are temporarily unavailable.",
        data: null,
      }),
    /Announcements are temporarily unavailable\./,
  );
});
