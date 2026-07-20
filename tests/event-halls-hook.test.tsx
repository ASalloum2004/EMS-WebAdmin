import "./setup-dom.js";
import assert from "node:assert/strict";
import { StrictMode } from "react";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useEventHalls } from "../src/features/management/hooks/useEventHalls.js";
import type { EventHall } from "../src/features/management/types.js";

const eventHalls: EventHall[] = [
  { id: 1, number: "1", area: 100, price_per_hour: "50000.00" },
  { id: 2, number: "2", area: 150, price_per_hour: "75000.00" },
];

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function getEventHallsResponse(data: EventHall[]) {
  return new Response(
    JSON.stringify({ status: true, message: "Success", data }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function EventHallsHarness({ enabled }: { enabled: boolean }) {
  const eventHallsState = useEventHalls({
    enabled,
    errorFallback: "Translated Event Hall error.",
  });

  return (
    <div>
      <button onClick={() => void eventHallsState.refetch()} type="button">
        Retry Event Halls
      </button>
      <output aria-label="Event Halls loading">
        {eventHallsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Event Halls values">
        {JSON.stringify(eventHallsState.eventHalls)}
      </output>
      {eventHallsState.error ? (
        <p role="alert">{eventHallsState.error}</p>
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
          ? JSON.stringify({ token: "event-halls-hook-test-token" })
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

test("does not request Event Halls until enabled", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = render(<EventHallsHarness enabled={false} />);

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  view.rerender(<EventHallsHarness enabled />);

  await waitFor(() => assert.equal(requestCount, 1));
  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
});

test("exposes loading and successful Event Hall data", async () => {
  const request = createDeferred<Response>();
  globalThis.fetch = async () => request.promise;
  const view = render(<EventHallsHarness enabled />);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls loading").textContent,
      "loading",
    ),
  );

  await act(async () => {
    request.resolve(getEventHallsResponse(eventHalls));
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(
    view.getByLabelText("Event Halls loading").textContent,
    "idle",
  );
});

test("exposes API errors and retries the Event Hall request", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(
        JSON.stringify({ message: "Event Halls are unavailable." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = render(<EventHallsHarness enabled />);

  await waitFor(() =>
    assert.equal(
      view.getByRole("alert").textContent,
      "Event Halls are unavailable.",
    ),
  );
  assert.equal(view.getByLabelText("Event Halls values").textContent, "[]");

  fireEvent.click(view.getByRole("button", { name: "Retry Event Halls" }));

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(requestCount, 2);
  assert.equal(view.queryByRole("alert"), null);
});

test("avoids duplicate initial Event Hall requests in Strict Mode", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = render(
    <StrictMode>
      <EventHallsHarness enabled />
    </StrictMode>,
  );

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(requestCount, 1);
});
