import assert from "node:assert/strict";
import test from "node:test";
import {
  getBoothRequestStatistics,
  normalizeBoothRequestStatisticsResponse,
} from "../src/features/order/api/boothRequestStatisticsApi.js";
import { getOrderSummaryStatistics } from "../src/features/order/data/orderSummaryStatistics.js";
import {
  getBoothRequestStatisticsFailureState,
  getBoothRequestStatisticsLoadingState,
  getBoothRequestStatisticsSuccessState,
} from "../src/features/order/hooks/useBoothRequestStatistics.js";
import type {
  BoothRequestStatisticsData,
  BoothRequestStatisticsResponse,
} from "../src/features/order/types.js";

const statisticsResponse: BoothRequestStatisticsResponse = {
  status: true,
  message: "booth request statistics retrived successfully",
  data: {
    total_requests: 3,
    pending_requests: 1,
    approved_requests: 2,
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
          ? JSON.stringify({ token: "statistics-test-token" })
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

test("calls the authenticated booth request statistics endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestedUrl = "";
  let requestHeaders = new Headers();
  let requestMethod = "";

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestHeaders = new Headers(init?.headers);
    requestMethod = init?.method ?? "";

    return new Response(JSON.stringify(statisticsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const statistics = await getBoothRequestStatistics();
    const url = new URL(requestedUrl);

    assert.equal(url.pathname, "/api/v1/admin/booths/requests/stats");
    assert.equal(url.search, "");
    assert.equal(requestMethod, "GET");
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer statistics-test-token",
    );
    assert.deepEqual(statistics, statisticsResponse.data);
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("maps every statistics API field to its correct summary card", () => {
  const statistics: BoothRequestStatisticsData = {
    total_requests: 41,
    pending_requests: 7,
    approved_requests: 19,
  };

  assert.deepEqual(getOrderSummaryStatistics(statistics), {
    total: 41,
    pending: 7,
    approved: 19,
  });

  assert.deepEqual(
    getOrderSummaryStatistics({
      total_requests: 82,
      pending_requests: 14,
      approved_requests: 38,
    }),
    {
      total: 82,
      pending: 14,
      approved: 38,
    },
  );
});

test("keeps statistics loading and failure states free of fake totals", () => {
  const successState = getBoothRequestStatisticsSuccessState(
    statisticsResponse.data,
  );
  const loadingState = getBoothRequestStatisticsLoadingState(successState);
  const failureState = getBoothRequestStatisticsFailureState(
    "Statistics unavailable.",
  );

  assert.equal(loadingState.isLoading, true);
  assert.deepEqual(loadingState.statistics, statisticsResponse.data);
  assert.deepEqual(getOrderSummaryStatistics(failureState.statistics), {
    total: null,
    pending: null,
    approved: null,
  });
  assert.equal(failureState.isLoading, false);
  assert.equal(failureState.error, "Statistics unavailable.");
});

test("propagates statistics API failures without fallback statistics", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Statistics unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () => getBoothRequestStatistics(),
      /Statistics unavailable\./,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("normalizes the expected booth request statistics response", () => {
  assert.deepEqual(
    normalizeBoothRequestStatisticsResponse(statisticsResponse),
    statisticsResponse.data,
  );
});
