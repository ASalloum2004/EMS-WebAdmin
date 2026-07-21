import "./setup-dom.js";
import assert from "node:assert/strict";
import { StrictMode, useState } from "react";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { useEventRequestDetails } from "../src/features/order/hooks/useEventRequestDetails.js";
import type { EventRequestDetailsApiData } from "../src/features/order/types.js";

const firstDetails: EventRequestDetailsApiData = {
  id: 3,
  title: "First Event",
  event_hall_id: 3,
  type: "conference",
  status: "approved",
  start_at: "2026-07-24T11:00:00.000000Z",
  end_at: "2026-07-24T14:00:00.000000Z",
  duration: 3,
  description: "First event description.",
  qr_token: null,
  eventable: null,
  speakers: [],
  average_rating: null,
  qr_scans_count: 0,
  saved_count: 0,
  created_at: "2026-07-21T08:00:55.000000Z",
  logo: null,
};

const secondDetails: EventRequestDetailsApiData = {
  ...firstDetails,
  id: 4,
  title: "Second Event",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getResponse(details: EventRequestDetailsApiData) {
  return new Response(
    JSON.stringify({ status: true, message: "Success", data: details }),
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
  const detailsState = useEventRequestDetails(
    selectedId,
    "Unable to load Event Request details.",
  );

  return (
    <div>
      <button onClick={() => setSelectedId(3)} type="button">
        Select first
      </button>
      <button onClick={() => setSelectedId(4)} type="button">
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

test("does not request a null Event ID and avoids duplicate Strict Mode requests", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getResponse(firstDetails);
  };
  const view = render(
    <StrictMode>
      <DetailsHarness />
    </StrictMode>,
  );

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  await waitFor(() =>
    assert.equal(view.getByLabelText("Details title").textContent, "First Event"),
  );
  assert.equal(requestCount, 1);
});

test("exposes loading, success, backend error, and same-ID Retry", async () => {
  const firstRequest = createDeferred<Response>();
  const requestedPaths: string[] = [];
  globalThis.fetch = async (input) => {
    requestedPaths.push(new URL(getRequestUrl(input)).pathname);

    return requestedPaths.length === 1
      ? firstRequest.promise
      : getResponse(firstDetails);
  };
  const view = render(<DetailsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  await waitFor(() =>
    assert.equal(view.getByLabelText("Details loading").textContent, "loading"),
  );
  assert.equal(view.getByLabelText("Details title").textContent, "none");

  await act(async () => {
    firstRequest.resolve(
      new Response(JSON.stringify({ message: "Details unavailable." }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }),
    );
    await firstRequest.promise;
  });

  assert.equal((await view.findByRole("alert")).textContent, "Details unavailable.");
  fireEvent.click(view.getByRole("button", { name: "Retry details" }));

  await waitFor(() =>
    assert.equal(view.getByLabelText("Details title").textContent, "First Event"),
  );
  assert.deepEqual(requestedPaths, [
    "/api/v1/admin/events/requests/3",
    "/api/v1/admin/events/requests/3",
  ]);
  assert.equal(view.queryByRole("alert"), null);
});

test("an older Event selection cannot overwrite a newer selection", async () => {
  const firstRequest = createDeferred<Response>();
  const secondRequest = createDeferred<Response>();
  globalThis.fetch = async (input) =>
    new URL(getRequestUrl(input)).pathname.endsWith("/3")
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
    assert.equal(view.getByLabelText("Details title").textContent, "Second Event"),
  );

  await act(async () => {
    firstRequest.resolve(getResponse(firstDetails));
    await firstRequest.promise;
  });
  assert.equal(view.getByLabelText("Details title").textContent, "Second Event");
});

test("closing Event details prevents a late response from appearing", async () => {
  const request = createDeferred<Response>();
  globalThis.fetch = async () => request.promise;
  const view = render(<DetailsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Select first" }));
  await waitFor(() =>
    assert.equal(view.getByLabelText("Details loading").textContent, "loading"),
  );
  fireEvent.click(view.getByRole("button", { name: "Close details" }));

  await act(async () => {
    request.resolve(getResponse(firstDetails));
    await request.promise;
  });

  assert.equal(view.getByLabelText("Details title").textContent, "none");
  assert.equal(view.getByLabelText("Details loading").textContent, "idle");
});
