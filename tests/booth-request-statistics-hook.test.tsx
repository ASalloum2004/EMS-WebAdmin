import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useBoothRequestStatistics } from "../src/features/order/hooks/useBoothRequestStatistics.js";
import type { BoothRequestStatisticsData } from "../src/features/order/types.js";

const initialStatistics: BoothRequestStatisticsData = {
  approved_requests: 3,
  pending_requests: 0,
  total_requests: 3,
};

const updatedStatistics: BoothRequestStatisticsData = {
  approved_requests: 4,
  pending_requests: 0,
  total_requests: 4,
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function getStatisticsResponse(statistics: BoothRequestStatisticsData) {
  return new Response(
    JSON.stringify({
      status: true,
      message: "booth request statistics retrieved successfully",
      data: statistics,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function StatisticsHarness() {
  const statisticsState = useBoothRequestStatistics();

  return (
    <div>
      <button onClick={() => void statisticsState.refetch()} type="button">
        Refresh statistics
      </button>
      <output aria-label="Statistics loading">
        {statisticsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Statistics values">
        {statisticsState.statistics
          ? JSON.stringify(statisticsState.statistics)
          : "unavailable"}
      </output>
      {statisticsState.error ? (
        <p role="alert">{statisticsState.error}</p>
      ) : null}
    </div>
  );
}

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
          ? JSON.stringify({ token: "statistics-hook-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
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

test("a new statistics response replaces the previous values", async () => {
  const responses = [initialStatistics, updatedStatistics];
  let requestCount = 0;
  globalThis.fetch = async () =>
    getStatisticsResponse(responses[requestCount++] ?? updatedStatistics);
  const view = render(<StatisticsHarness />);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Statistics values").textContent,
      JSON.stringify(initialStatistics),
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Refresh statistics" }));

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Statistics values").textContent,
      JSON.stringify(updatedStatistics),
    ),
  );
  assert.equal(requestCount, 2);
});

test("slower stale statistics responses cannot overwrite newer values", async () => {
  const staleRequest = createDeferred<Response>();
  const latestRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return getStatisticsResponse(initialStatistics);
    }

    return requestCount === 2 ? staleRequest.promise : latestRequest.promise;
  };
  const view = render(<StatisticsHarness />);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Statistics values").textContent,
      JSON.stringify(initialStatistics),
    ),
  );

  const refreshButton = view.getByRole("button", {
    name: "Refresh statistics",
  });
  fireEvent.click(refreshButton);
  fireEvent.click(refreshButton);

  await act(async () => {
    latestRequest.resolve(getStatisticsResponse(updatedStatistics));
    await latestRequest.promise;
  });

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Statistics values").textContent,
      JSON.stringify(updatedStatistics),
    ),
  );

  const staleStatistics: BoothRequestStatisticsData = {
    approved_requests: 2,
    pending_requests: 1,
    total_requests: 3,
  };

  await act(async () => {
    staleRequest.resolve(getStatisticsResponse(staleStatistics));
    await staleRequest.promise;
  });

  assert.equal(
    view.getByLabelText("Statistics values").textContent,
    JSON.stringify(updatedStatistics),
  );
  assert.equal(requestCount, 3);
});

test("loading preserves the last successful statistics values", async () => {
  const refreshRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    return requestCount === 1
      ? getStatisticsResponse(initialStatistics)
      : refreshRequest.promise;
  };
  const view = render(<StatisticsHarness />);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Statistics values").textContent,
      JSON.stringify(initialStatistics),
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Refresh statistics" }));

  assert.equal(
    view.getByLabelText("Statistics loading").textContent,
    "loading",
  );
  assert.equal(
    view.getByLabelText("Statistics values").textContent,
    JSON.stringify(initialStatistics),
  );

  await act(async () => {
    refreshRequest.resolve(getStatisticsResponse(updatedStatistics));
    await refreshRequest.promise;
  });
});
