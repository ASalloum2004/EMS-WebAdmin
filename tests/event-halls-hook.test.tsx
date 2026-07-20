import "./setup-dom.js";
import assert from "node:assert/strict";
import { StrictMode } from "react";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DataTable } from "../src/components/DataTable/DataTable.js";
import { ManagementBoothFiltersPanel } from "../src/features/management/components/ManagementBoothFiltersPanel/ManagementBoothFiltersPanel.js";
import { getEventHallColumns } from "../src/features/management/components/tableColumns.js";
import { useEventHalls } from "../src/features/management/hooks/useEventHalls.js";
import type { EventHall } from "../src/features/management/types.js";
import {
  I18nProvider,
  useI18n,
} from "../src/i18n/I18nContext.js";

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

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function EventHallsHarness({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const eventHallsState = useEventHalls({
    enabled,
    errorFallback: t.management.eventHalls.errorFallback,
    validationMessages: t.management.validation,
  });

  return (
    <div>
      <button
        onClick={eventHallsState.toggleFilterPanel}
        type="button"
      >
        Toggle Event Hall Filters
      </button>
      <button
        onClick={() =>
          eventHallsState.setDraftFilters({
            ...eventHallsState.draftFilters,
            minArea: "invalid",
          })
        }
        type="button"
      >
        Set Invalid Event Hall Filter
      </button>
      <button
        onClick={() => void eventHallsState.refetch()}
        type="button"
      >
        Retry Event Halls
      </button>

      <output aria-label="Event Halls loading">
        {eventHallsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Event Halls values">
        {JSON.stringify(eventHallsState.eventHalls)}
      </output>

      {eventHallsState.isFilterPanelOpen ? (
        <ManagementBoothFiltersPanel
          filters={eventHallsState.draftFilters}
          mode="eventHall"
          onApply={eventHallsState.applyFilters}
          onChange={eventHallsState.setDraftFilters}
          onClear={eventHallsState.clearFilters}
          validationMessage={eventHallsState.validationMessage}
        />
      ) : null}

      {eventHallsState.error ? (
        <p role="alert">{eventHallsState.error}</p>
      ) : null}

      {!eventHallsState.isLoading && !eventHallsState.error ? (
        <DataTable
          ariaLabel={t.management.eventHalls.ariaLabel}
          columns={getEventHallColumns(t)}
          emptyMessage={t.management.eventHalls.empty}
          getItemKey={(eventHall) => eventHall.id}
          items={eventHallsState.eventHalls}
        />
      ) : null}
    </div>
  );
}

function renderEventHallsHarness(enabled: boolean, strictMode = false) {
  const content = (
    <I18nProvider>
      <EventHallsHarness enabled={enabled} />
    </I18nProvider>
  );

  return render(strictMode ? <StrictMode>{content}</StrictMode> : content);
}

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
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
  window.localStorage.clear();

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
  const view = renderEventHallsHarness(false);

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  view.rerender(
    <I18nProvider>
      <EventHallsHarness enabled />
    </I18nProvider>,
  );

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
  const view = renderEventHallsHarness(true);

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

test("opening and closing filters does not request, while Apply requests once", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));

  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });
  fireEvent.click(toggleButton);
  assert.equal(requestedUrls.length, 1);
  fireEvent.click(toggleButton);
  assert.equal(requestedUrls.length, 1);
  fireEvent.click(toggleButton);

  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(requestedUrls.length, 2));
  const appliedUrl = new URL(requestedUrls[1]);
  assert.equal(appliedUrl.searchParams.get("filter[min_area]"), "100");
  assert.equal(Array.from(appliedUrl.searchParams).length, 1);
  assert.equal(view.queryByRole("dialog"), null);
});

test("invalid numeric filters do not trigger a request", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.click(
    view.getByRole("button", { name: "Set Invalid Event Hall Filter" }),
  );

  assert.equal(
    view.getByRole("alert").textContent,
    "Enter a valid minimum area.",
  );
  const applyButton = view.getByRole("button", {
    name: "Apply",
  }) as HTMLButtonElement;
  assert.equal(applyButton.disabled, true);
  fireEvent.click(applyButton);
  await act(async () => undefined);
  assert.equal(requestCount, 1);
});

test("Clear requests the complete unfiltered Event Hall list", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);
  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));

  fireEvent.click(toggleButton);
  fireEvent.click(view.getByRole("button", { name: "Clear" }));

  await waitFor(() => assert.equal(requestedUrls.length, 3));
  assert.equal(new URL(requestedUrls[2]).search, "");
  assert.equal(
    (view.getByLabelText("Minimum area") as HTMLInputElement).value,
    "",
  );
});

test("Retry preserves the currently applied backend filters", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));

    if (requestedUrls.length === 2) {
      return new Response(
        JSON.stringify({ message: "Filtered Event Halls unavailable." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.equal(
      view.getByRole("alert").textContent,
      "Filtered Event Halls unavailable.",
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Retry Event Halls" }));

  await waitFor(() => assert.equal(requestedUrls.length, 3));
  assert.equal(
    new URL(requestedUrls[1]).searchParams.get("filter[min_area]"),
    "100",
  );
  assert.equal(
    new URL(requestedUrls[2]).searchParams.get("filter[min_area]"),
    "100",
  );
});

test("a filtered empty response displays the translated empty state", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(requestCount === 1 ? eventHalls : []);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.change(view.getByLabelText("Minimum Price"), {
    target: { value: "100000" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.equal(
      view.getByText("No event halls found.").textContent,
      "No event halls found.",
    ),
  );
});

test("an older response cannot overwrite a newer filtered response", async () => {
  const olderRequest = createDeferred<Response>();
  const newerRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return getEventHallsResponse(eventHalls);
    }

    return requestCount === 2 ? olderRequest.promise : newerRequest.promise;
  };
  const view = renderEventHallsHarness(true);
  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestCount, 2));

  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "200" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestCount, 3));

  const newerEventHalls = [eventHalls[1]];
  await act(async () => {
    newerRequest.resolve(getEventHallsResponse(newerEventHalls));
    await newerRequest.promise;
  });
  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(newerEventHalls),
    ),
  );

  await act(async () => {
    olderRequest.resolve(getEventHallsResponse([eventHalls[0]]));
    await olderRequest.promise;
    await Promise.resolve();
  });
  assert.equal(
    view.getByLabelText("Event Halls values").textContent,
    JSON.stringify(newerEventHalls),
  );
});

test("avoids duplicate initial Event Hall requests in Strict Mode", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true, true);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(requestCount, 1);
});
