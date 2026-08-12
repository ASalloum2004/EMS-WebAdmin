import assert from "node:assert/strict";
import test from "node:test";
import {
  getReportStatistics,
  normalizeReportStatisticsResponse,
} from "../src/features/reports/api/reportStatisticsApi.js";
import {
  getReportStatisticsFailureState,
  getReportStatisticsLoadingState,
  getReportStatisticsSuccessState,
} from "../src/features/reports/hooks/useReportStatistics.js";
import type {
  ReportStatisticsData,
  ReportStatisticsResponse,
} from "../src/features/reports/types.js";

const statisticsResponse: ReportStatisticsResponse = {
  status: true,
  message: "Success",
  data: {
    total_requests: 10,
    pending_requests: 4,
    resolved_requests: 5,
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
          ? JSON.stringify({ token: "report-statistics-test-token" })
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

test("calls the authenticated report statistics endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestedUrl = "";
  let requestCache: RequestCache | undefined;
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
    requestCache = init?.cache;
    requestMethod = init?.method ?? "";

    return new Response(JSON.stringify(statisticsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const statistics = await getReportStatistics();
    const url = new URL(requestedUrl);

    assert.equal(url.pathname, "/api/v1/admin/reports/statistics");
    assert.equal(url.search, "");
    assert.equal(requestMethod, "GET");
    assert.equal(requestCache, "no-store");
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer report-statistics-test-token",
    );
    assert.deepEqual(statistics, statisticsResponse.data);
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("normalizes every report statistics field used by the cards", () => {
  assert.deepEqual(
    normalizeReportStatisticsResponse(statisticsResponse),
    statisticsResponse.data,
  );
});

test("rejects incomplete report statistics responses", () => {
  const incompleteResponse = {
    ...statisticsResponse,
    data: {
      total_requests: 10,
      pending_requests: 4,
      resolved_requests: 5,
    },
  } as unknown as ReportStatisticsResponse;

  assert.throws(
    () => normalizeReportStatisticsResponse(incompleteResponse),
    /Unexpected report statistics response format\./,
  );
});

test("keeps loading and failure states free of mock statistics", () => {
  const successState = getReportStatisticsSuccessState(
    statisticsResponse.data,
  );
  const loadingState = getReportStatisticsLoadingState(successState);
  const failureState = getReportStatisticsFailureState(
    "Statistics unavailable.",
  );

  assert.equal(loadingState.isLoading, true);
  assert.deepEqual(loadingState.statistics, statisticsResponse.data);
  assert.equal(failureState.isLoading, false);
  assert.equal(failureState.statistics, null);
  assert.equal(failureState.error, "Statistics unavailable.");
});

test("propagates report statistics API failures", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Statistics unavailable." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () => getReportStatistics(),
      /Statistics unavailable\./,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

const cardValues: ReportStatisticsData = statisticsResponse.data;

test("the expected backend fields map to the four report card values", () => {
  assert.deepEqual(
    [
      cardValues.total_requests,
      cardValues.pending_requests,
      cardValues.resolved_requests,
      cardValues.rejected_requests,
    ],
    [10, 4, 5, 1],
  );
});
