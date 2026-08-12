import "./setup-dom.js";
import assert from "node:assert/strict";
import { useState } from "react";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { useReportDetails } from "../src/features/reports/hooks/useReportDetails.js";
import type { ReportApiData } from "../src/features/reports/types.js";

const firstDetails: ReportApiData = {
  admin_notes: null,
  created_at: "2026-08-12T10:52:59.000000Z",
  description: "First report description.",
  id: 7,
  status: "pending",
  title: "First Report",
};

const secondDetails: ReportApiData = {
  ...firstDetails,
  id: 8,
  title: "Second Report",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getResponse(details: ReportApiData) {
  return new Response(
    JSON.stringify({ data: details, message: "Success", status: true }),
    {
      headers: { "Content-Type": "application/json" },
      status: 200,
    },
  );
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function DetailsHarness() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailsState = useReportDetails(
    selectedId,
    "Unable to load report details.",
  );

  return (
    <div>
      <button onClick={() => setSelectedId(7)} type="button">
        Select first
      </button>
      <button onClick={() => setSelectedId(8)} type="button">
        Select second
      </button>
      <button onClick={() => setSelectedId(null)} type="button">
        Close details
      </button>
      <button onClick={() => void detailsState.refetch()} type="button">
        Retry details
      </button>
      <output aria-label="Details loading">
        {detailsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Details title">
        {detailsState.details?.title ?? "none"}
      </output>
      {detailsState.error ? <p role="alert">{detailsState.error}</p> : null}
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
          ? JSON.stringify({ token: `${Date.now()}-${Math.random()}` })
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

test("loads the selected Report ID and retries the same ID after an error", async () => {
  const requestedPaths: string[] = [];
  globalThis.fetch = async (input) => {
    requestedPaths.push(new URL(getRequestUrl(input)).pathname);

    return requestedPaths.length === 1
      ? new Response(JSON.stringify({ message: "Details unavailable." }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        })
      : getResponse(firstDetails);
  };
  const view = render(<DetailsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  assert.equal(view.getByLabelText("Details loading").textContent, "loading");
  assert.equal(
    (await view.findByRole("alert")).textContent,
    "Details unavailable.",
  );

  fireEvent.click(view.getByRole("button", { name: "Retry details" }));
  await waitFor(() =>
    assert.equal(view.getByLabelText("Details title").textContent, "First Report"),
  );
  assert.deepEqual(requestedPaths, [
    "/api/v1/admin/reports/7",
    "/api/v1/admin/reports/7",
  ]);
});

test("an older Report selection cannot overwrite a newer selection", async () => {
  const firstRequest = createDeferred<Response>();
  const secondRequest = createDeferred<Response>();
  globalThis.fetch = async (input) =>
    new URL(getRequestUrl(input)).pathname.endsWith("/7")
      ? firstRequest.promise
      : secondRequest.promise;
  const view = render(<DetailsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  fireEvent.click(view.getByRole("button", { name: "Select second" }));

  await act(async () => {
    secondRequest.resolve(getResponse(secondDetails));
    await secondRequest.promise;
  });
  await waitFor(() =>
    assert.equal(view.getByLabelText("Details title").textContent, "Second Report"),
  );

  await act(async () => {
    firstRequest.resolve(getResponse(firstDetails));
    await firstRequest.promise;
  });
  assert.equal(view.getByLabelText("Details title").textContent, "Second Report");
});

test("closing Report details prevents a late response from appearing", async () => {
  const request = createDeferred<Response>();
  globalThis.fetch = async () => request.promise;
  const view = render(<DetailsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  fireEvent.click(view.getByRole("button", { name: "Close details" }));

  await act(async () => {
    request.resolve(getResponse(firstDetails));
    await request.promise;
  });

  assert.equal(view.getByLabelText("Details title").textContent, "none");
  assert.equal(view.getByLabelText("Details loading").textContent, "idle");
});
