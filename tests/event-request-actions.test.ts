import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  approveEventRequest,
  buildApproveEventRequestPath,
  buildRejectEventRequestPath,
  normalizeEventRequestActionResponse,
  rejectEventRequest,
} from "../src/features/order/api/index.js";
import type { EventRequestActionResponse } from "../src/features/order/types.js";

const successResponse: EventRequestActionResponse = {
  status: true,
  message: "Success",
  data: null,
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "event-action-test-token" })
          : null,
    } as Storage,
  });
});

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

test("builds Event Request action paths with the selected request ID", () => {
  assert.equal(
    buildApproveEventRequestPath(902),
    "events/requests/902/approve",
  );
  assert.equal(
    buildApproveEventRequestPath(902, 3),
    "events/requests/902/approve?page=3",
  );
  assert.equal(
    buildRejectEventRequestPath(902),
    "events/requests/902/reject",
  );

  for (const invalidId of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildApproveEventRequestPath(invalidId),
      /valid event request ID/i,
    );
    assert.throws(
      () => buildRejectEventRequestPath(invalidId),
      /valid event request ID/i,
    );
  }
});

test("normalizes successful Event Request action responses", () => {
  assert.deepEqual(
    normalizeEventRequestActionResponse({
      ...successResponse,
      message: "  Success  ",
    }),
    successResponse,
  );
  assert.throws(
    () =>
      normalizeEventRequestActionResponse({
        status: true,
        message: "",
        data: null,
      }),
    /Unexpected event request action response format/,
  );
});

test("Approve sends an authenticated POST for the Event Request ID with force false", async () => {
  let requestedUrl = "";
  let requestMethod = "";
  let requestBody: BodyInit | null | undefined;
  let requestHeaders = new Headers();

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestMethod = init?.method ?? "";
    requestBody = init?.body;
    requestHeaders = new Headers(init?.headers);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await approveEventRequest(902);
  const url = new URL(requestedUrl);

  assert.deepEqual(result, { kind: "approved", response: successResponse });
  assert.equal(url.pathname, "/api/v1/admin/events/requests/902/approve");
  assert.equal(url.search, "");
  assert.equal(requestMethod, "POST");
  assert.deepEqual(JSON.parse(String(requestBody)), { force: false });
  assert.equal(
    requestHeaders.get("Authorization"),
    "Bearer event-action-test-token",
  );
  assert.equal(requestHeaders.get("Content-Type"), "application/json");
});

test("Reject sends PATCH without an unnecessary body", async () => {
  let requestedUrl = "";
  let requestMethod = "";
  let requestBody: BodyInit | null | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestMethod = init?.method ?? "";
    requestBody = init?.body;

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  assert.deepEqual(await rejectEventRequest(417), successResponse);
  assert.equal(
    new URL(requestedUrl).pathname,
    "/api/v1/admin/events/requests/417/reject",
  );
  assert.equal(requestMethod, "PATCH");
  assert.equal(requestBody, undefined);
});

test("reads 409 conflicts and pagination from errors.data while preserving a null message", async () => {
  let requestedUrl = "";
  let requestBody: BodyInit | null | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestBody = init?.body;

    return new Response(
      JSON.stringify({
        status: false,
        message: null,
        errors: {
          data: {
            data: [
              {
                id: 9,
                title: "Approval Conflict Pair B",
                event_hall_id: 3,
                type: "conference",
                status: "pending",
                start_at: "2026-08-12T10:00:00.000000Z",
                end_at: "2026-08-12T12:00:00.000000Z",
                duration: 2,
                description: "Excluded conflict description",
                eventable: { id: 1, name: "Dar Al feker" },
                created_at: "2026-07-21T14:05:08.000000Z",
                logo: null,
              },
            ],
            meta: {
              current_page: 2,
              per_page: 3,
              total: 4,
              last_page: 2,
            },
          },
        },
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  };

  const result = await approveEventRequest(902, {
    force: false,
    page: 2,
  });
  const url = new URL(requestedUrl);

  assert.equal(result.kind, "conflict");
  if (result.kind !== "conflict") {
    throw new Error("Expected an approval conflict.");
  }

  assert.equal(result.message, null);
  assert.deepEqual(result.requests, [
    {
      id: 9,
      title: "Approval Conflict Pair B",
      event_hall_id: 3,
      type: "conference",
      status: "pending",
      start_at: "2026-08-12T10:00:00.000000Z",
      end_at: "2026-08-12T12:00:00.000000Z",
      duration: 2,
      created_at: "2026-07-21T14:05:08.000000Z",
      eventable: { name: "Dar Al feker" },
    },
  ]);
  assert.deepEqual(result.meta, {
    current_page: 2,
    per_page: 3,
    total: 4,
    last_page: 2,
  });
  assert.equal(url.searchParams.get("page"), "2");
  assert.deepEqual(JSON.parse(String(requestBody)), { force: false });
});

test("forced approval sends force true without a conflict-page query", async () => {
  let requestedUrl = "";
  let requestBody: BodyInit | null | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestBody = init?.body;

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await approveEventRequest(902, {
    force: true,
    page: 4,
  });
  const url = new URL(requestedUrl);

  assert.equal(result.kind, "approved");
  assert.equal(url.pathname, "/api/v1/admin/events/requests/902/approve");
  assert.equal(url.search, "");
  assert.deepEqual(JSON.parse(String(requestBody)), { force: true });
});
