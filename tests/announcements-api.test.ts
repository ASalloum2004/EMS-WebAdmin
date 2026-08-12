import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { API_BASE_URL } from "../src/api/apiClient.js";
import {
  AnnouncementListTimeoutError,
  buildAnnouncementsPath,
  getAnnouncements,
  normalizeAnnouncementsResponse,
} from "../src/features/announcements/api/announcementsApi.js";
import { normalizeAnnouncementDetailsResponse } from "../src/features/announcements/api/announcementDetailsApi.js";
import { createAnnouncement } from "../src/features/announcements/api/createAnnouncementApi.js";
import { updateAnnouncement } from "../src/features/announcements/api/updateAnnouncementApi.js";
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
    new URL("/storage/announcement.png", API_BASE_URL).toString(),
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

test("announcement mapping rejects inline media instead of treating Base64 as a saved URL", () => {
  const response: AnnouncementDetailsResponse = {
    status: true,
    message: "Announcement retrieved successfully.",
    data: {
      ...apiAnnouncement,
      media: "data:image/png;base64,aGVsbG8=",
    },
  };

  assert.equal(normalizeAnnouncementDetailsResponse(response).media, null);
});

function getRequestFormData(request: { init?: RequestInit }) {
  assert.ok(request.init?.body instanceof FormData);
  return request.init.body;
}

function assertMultipartHeaders(init: RequestInit | undefined) {
  const headers = new Headers(init?.headers);

  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), "Bearer announcement-test-token");
  assert.equal(headers.has("Content-Type"), false);
}

async function assertUploadedFile(
  value: FormDataEntryValue | null,
  expected: File,
) {
  assert.ok(value instanceof File);
  assert.equal(value.name, expected.name);
  assert.equal(value.type, expected.type);
  assert.equal(value.size, expected.size);
  assert.deepEqual(
    new Uint8Array(await value.arrayBuffer()),
    new Uint8Array(await expected.arrayBuffer()),
  );
}

test("create sends authenticated multipart data with the original media bytes", async () => {
  const requests: Array<{ init?: RequestInit; url: string }> = [];
  const mediaFile = new File(["image-bytes"], "notice.png", {
    type: "image/png",
  });

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
    mediaFile,
  });

  const request = requests[0];
  assert.ok(request);
  assert.equal(request.url.endsWith("/api/v1/admin/announcements"), true);
  assert.equal(request.init?.method, "POST");
  assertMultipartHeaders(request.init);
  const formData = getRequestFormData(request);
  assert.equal(formData.get("title"), "Draft notice");
  assert.equal(formData.get("description"), "Saved for later.");
  assert.equal(formData.get("receiver"), "Exhibitors");
  assert.equal(formData.get("is_active"), "1");
  assert.equal(formData.has("_method"), false);
  await assertUploadedFile(formData.get("media"), mediaFile);
  assert.equal(result.message, "Announcement created.");
});

test("create serializes published state as Laravel boolean zero", async () => {
  let requestInit: RequestInit | undefined;

  globalThis.fetch = async (_input, init) => {
    requestInit = init;
    return new Response(JSON.stringify({ status: true, message: "Created" }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  await createAnnouncement({
    title: "Announcement",
    description: "Description",
    receiver: "all",
    isDraft: false,
    mediaFile: null,
  });

  const formData = getRequestFormData({ init: requestInit });
  assert.equal(formData.get("is_active"), "0");
  assert.equal(formData.has("media"), false);
});

test("update uses POST multipart, replaces media with file bytes, and keeps headers", async () => {
  const requests: Array<{ init?: RequestInit; url: string }> = [];
  const mediaFile = new File(["replacement"], "replacement.webp", {
    type: "image/webp",
  });

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
    return new Response(JSON.stringify({ status: true, message: "Updated" }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  await updateAnnouncement(17, {
    title: " Announcement ",
    description: " Description ",
    receiver: "visitors",
    isDraft: false,
    mediaFile,
    mediaUpdate: "replace",
  });

  const request = requests[0];
  assert.ok(request);
  assert.equal(request.url.endsWith("/api/v1/admin/announcements/17"), true);
  assert.equal(request.init?.method, "POST");
  assertMultipartHeaders(request.init);
  const formData = getRequestFormData(request);
  assert.equal(formData.get("_method"), "PATCH");
  assert.equal(formData.get("title"), "Announcement");
  assert.equal(formData.get("description"), "Description");
  assert.equal(formData.get("receiver"), "visitors");
  assert.equal(formData.get("is_active"), "0");
  await assertUploadedFile(formData.get("media"), mediaFile);
});

test("update preserve omits media and remove sends Laravel-nullable empty field", async () => {
  const requestBodies: FormData[] = [];

  globalThis.fetch = async (_input, init) => {
    assert.ok(init?.body instanceof FormData);
    requestBodies.push(init.body);
    return new Response(JSON.stringify({ status: true, message: "Updated" }), {
      headers: { "Content-Type": "application/json" },
    });
  };

  const baseValues = {
    title: "Announcement",
    description: "Description",
    receiver: "visitors" as const,
    isDraft: false,
    mediaFile: null,
  };

  await updateAnnouncement(17, {
    ...baseValues,
    mediaUpdate: "preserve",
  });
  await updateAnnouncement(17, {
    ...baseValues,
    mediaUpdate: "remove",
  });

  assert.equal(requestBodies[0]?.has("media"), false);
  assert.equal(requestBodies[1]?.has("media"), true);
  assert.equal(requestBodies[1]?.get("media"), "");
  assert.equal(requestBodies[0]?.get("_method"), "PATCH");
  assert.equal(requestBodies[1]?.get("_method"), "PATCH");
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
