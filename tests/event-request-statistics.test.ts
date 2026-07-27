import assert from "node:assert/strict";
import test from "node:test";
import {
  getEventRequestStatistics,
  normalizeEventRequestStatisticsResponse,
} from "../src/features/order/api/eventRequestStatisticsApi.js";
import {
  getEventRequestSummaryStatistics,
  type EventRequestStatsResponse,
} from "../src/features/order/types.js";

const statisticsResponse: EventRequestStatsResponse = {
  status: true,
  message: "Success",
  data: {
    total_requests: 5,
    pending_requests: 2,
    approved_requests: 2,
    rejected_requests: 1,
  },
};

function installAuthenticatedSession() {
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "event-statistics-test-token" })
          : null,
    } as Storage,
  });

  return () => {
    if (sessionStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "sessionStorage",
        sessionStorageDescriptor,
      );
    } else {
      Reflect.deleteProperty(globalThis, "sessionStorage");
    }
  };
}

test("calls the authenticated Event Request statistics endpoint once", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestCount = 0;
  let requestedUrl = "";
  let requestHeaders = new Headers();

  globalThis.fetch = async (input, init) => {
    requestCount += 1;
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestHeaders = new Headers(init?.headers);

    return new Response(JSON.stringify(statisticsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const statistics = await getEventRequestStatistics();
    const url = new URL(requestedUrl);

    assert.equal(requestCount, 1);
    assert.equal(url.pathname, "/api/v1/admin/events/requests/stats");
    assert.equal(requestHeaders.get("Authorization"), "Bearer event-statistics-test-token");
    assert.deepEqual(statistics, statisticsResponse.data);
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("maps only total, pending, and approved Event Request statistics", () => {
  assert.deepEqual(
    getEventRequestSummaryStatistics(statisticsResponse.data),
    {
      total: 5,
      pending: 2,
      approved: 2,
    },
  );

  assert.equal(
    "rejected" in getEventRequestSummaryStatistics(statisticsResponse.data),
    false,
  );
});

test("rejects unsuccessful and invalid Event Request statistics responses", () => {
  assert.throws(
    () =>
      normalizeEventRequestStatisticsResponse({
        ...statisticsResponse,
        status: false,
      }),
    /Unexpected event request statistics response format/,
  );
  assert.throws(
    () =>
      normalizeEventRequestStatisticsResponse({
        ...statisticsResponse,
        data: {
          ...statisticsResponse.data,
          pending_requests: Number.NaN,
        },
      }),
    /Unexpected event request statistics response format/,
  );
});
