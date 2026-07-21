import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiRequestError } from "../src/api/apiClient.js";
import {
  DEFAULT_EVENT_REQUESTS_PER_PAGE,
  buildEventRequestsPath,
  getEventRequests,
  normalizeEventRequestsResponse,
} from "../src/features/order/api/eventRequestsApi.js";
import type {
  EventRequestsResponse,
  GetEventRequestsParams,
} from "../src/features/order/types.js";

const rawEventRequest = {
  id: 3,
  title: "The Future of Publishing",
  event_hall_id: 3,
  type: "conference",
  status: "approved",
  start_at: "2026-07-24T11:00:00.000000Z",
  end_at: "2026-07-24T14:00:00.000000Z",
  duration: 3,
  description: "Backend-only event description.",
  qr_token: "NON_UI_QR_VALUE",
  created_at: "2026-07-21T08:00:55.000000Z",
  logo: null,
};

const eventRequestsResponse: EventRequestsResponse = {
  status: true,
  message: "Success",
  data: {
    data: [rawEventRequest],
    current_page: 2,
    per_page: 15,
    total: 20,
    last_page: 2,
  },
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function getSearchParams(params: GetEventRequestsParams = {}) {
  return new URL(
    buildEventRequestsPath(params),
    "https://ems.invalid",
  ).searchParams;
}

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

test("builds Event Request paths with documented pagination, filters, and sort", () => {
  assert.equal(DEFAULT_EVENT_REQUESTS_PER_PAGE, 15);
  assert.equal(
    buildEventRequestsPath(),
    "events/requests?page=1&per_page=15",
  );
  assert.equal(
    buildEventRequestsPath({ page: 2, perPage: 30 }),
    "events/requests?page=2&per_page=30",
  );

  const searchParams = getSearchParams({
    createdDate: "2026-07-21",
    page: 3,
    perPage: 15,
    sort: "-created_at",
    status: "approved",
    title: "Publishing & Exhibitions",
  });

  assert.equal(searchParams.get("page"), "3");
  assert.equal(searchParams.get("per_page"), "15");
  assert.equal(
    searchParams.get("filter[title]"),
    "Publishing & Exhibitions",
  );
  assert.equal(searchParams.get("filter[status]"), "approved");
  assert.equal(searchParams.get("filter[created_date]"), "2026-07-21");
  assert.equal(searchParams.get("sort"), "-created_at");
});

test("omits empty and unsupported Event Request parameters", () => {
  const searchParams = getSearchParams({
    createdDate: "   ",
    page: 0,
    perPage: Number.NaN,
    sort: "title" as GetEventRequestsParams["sort"],
    status: "unknown" as GetEventRequestsParams["status"],
    title: "   ",
  });

  assert.equal(searchParams.get("page"), "1");
  assert.equal(searchParams.get("per_page"), "15");
  assert.equal(searchParams.has("filter[title]"), false);
  assert.equal(searchParams.has("filter[status]"), false);
  assert.equal(searchParams.has("filter[created_date]"), false);
  assert.equal(searchParams.has("sort"), false);
});

test("normalizes nested Event Requests and strips every non-UI field", () => {
  const result = normalizeEventRequestsResponse(eventRequestsResponse);

  assert.deepEqual(result.requests, [
    {
      id: 3,
      title: "The Future of Publishing",
      event_hall_id: 3,
      type: "conference",
      status: "approved",
      start_at: "2026-07-24T11:00:00.000000Z",
      end_at: "2026-07-24T14:00:00.000000Z",
      created_at: "2026-07-21T08:00:55.000000Z",
    },
  ]);
  assert.deepEqual(result.pagination, {
    currentPage: 2,
    perPage: 15,
    totalItems: 20,
    totalPages: 2,
  });

  const normalizedRecord = result.requests[0] as Record<string, unknown>;
  assert.equal("duration" in normalizedRecord, false);
  assert.equal("description" in normalizedRecord, false);
  assert.equal("qr_token" in normalizedRecord, false);
  assert.equal("logo" in normalizedRecord, false);
});

test("uses safe requested and calculated pagination fallbacks", () => {
  const result = normalizeEventRequestsResponse(
    {
      ...eventRequestsResponse,
      data: {
        ...eventRequestsResponse.data,
        current_page: 0,
        per_page: 0,
        total: -1,
        last_page: 0,
      },
    },
    { page: 4, perPage: 10 },
  );

  assert.deepEqual(result.pagination, {
    currentPage: 4,
    perPage: 10,
    totalItems: 1,
    totalPages: 1,
  });
});

test("throws a clear error for invalid Event Request response shapes", () => {
  assert.throws(
    () =>
      normalizeEventRequestsResponse({
        ...eventRequestsResponse,
        data: {
          ...eventRequestsResponse.data,
          data: null as unknown as EventRequestsResponse["data"]["data"],
        },
      }),
    /Unexpected event requests response format/,
  );
});

test("fetches Event Requests with GET, authentication, and the admin path", async () => {
  const generatedToken = installGeneratedAuthSession();
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestedInit = init;

    return new Response(JSON.stringify(eventRequestsResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const result = await getEventRequests({
    page: 2,
    perPage: 15,
    title: "Publishing",
  });
  const url = new URL(requestedUrl);
  const headers = new Headers(requestedInit?.headers);

  assert.equal(url.pathname, "/api/v1/admin/events/requests");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("per_page"), "15");
  assert.equal(url.searchParams.get("filter[title]"), "Publishing");
  assert.equal(requestedInit?.method, "GET");
  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), `Bearer ${generatedToken}`);
  assert.equal(result.requests.length, 1);
});

test("preserves backend 401 Event Request errors", async () => {
  installGeneratedAuthSession();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Authentication required." }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });

  await assert.rejects(
    () => getEventRequests(),
    (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 401);
      assert.equal(error.message, "Authentication required.");
      return true;
    },
  );
});
