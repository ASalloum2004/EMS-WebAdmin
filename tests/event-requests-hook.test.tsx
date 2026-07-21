import "./setup-dom.js";
import assert from "node:assert/strict";
import { StrictMode } from "react";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { OrderFiltersPanel } from "../src/features/order/components/OrderFiltersPanel/OrderFiltersPanel.js";
import { useEventRequests } from "../src/features/order/hooks/useEventRequests.js";
import type { EventRequestApiData } from "../src/features/order/types.js";
import {
  I18nProvider,
  useI18n,
} from "../src/i18n/I18nContext.js";

const firstEvent: EventRequestApiData = {
  id: 3,
  title: "The Future of Publishing",
  event_hall_id: 3,
  type: "conference",
  status: "approved",
  start_at: "2026-07-24T11:00:00.000000Z",
  end_at: "2026-07-24T14:00:00.000000Z",
  duration: 3,
  description: "Backend-only event description.",
  qr_token: null,
  created_at: "2026-07-21T08:00:55.000000Z",
  logo: null,
};

const secondEvent: EventRequestApiData = {
  ...firstEvent,
  id: 4,
  title: "Modern Exhibition Design",
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

function getEventRequestsResponse(
  items: EventRequestApiData[],
  currentPage = 1,
  total = items.length,
  lastPage = Math.max(1, Math.ceil(total / 15)),
) {
  return new Response(
    JSON.stringify({
      status: true,
      message: "Success",
      data: {
        data: items,
        current_page: currentPage,
        per_page: 15,
        total,
        last_page: lastPage,
      },
    }),
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

function EventRequestsHarness({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const state = useEventRequests({
    enabled,
    errorFallback: t.order.eventRequests.table.loadError,
  });

  return (
    <div>
      <input
        aria-label="Event title search"
        onChange={(event) => state.setSearchValue(event.target.value)}
        value={state.searchValue}
      />
      <button onClick={() => state.setCurrentPage(2)} type="button">
        Page two
      </button>
      <button onClick={state.filters.toggleFilterPanel} type="button">
        Toggle filters
      </button>
      <button onClick={() => void state.refetch()} type="button">
        Retry events
      </button>

      <output aria-label="Event loading">
        {state.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Event values">
        {JSON.stringify(state.requests)}
      </output>
      <output aria-label="Event page">{state.currentPage}</output>

      {state.filters.isFilterPanelOpen ? (
        <OrderFiltersPanel
          ariaLabel={t.order.eventRequests.filters.panelAriaLabel}
          filters={state.filters.draftFilters}
          onApply={state.filters.applyFilters}
          onChange={state.filters.setDraftFilters}
          onClear={state.filters.clearFilters}
        />
      ) : null}

      {state.error ? <p role="alert">{state.error}</p> : null}
    </div>
  );
}

function renderHarness(enabled: boolean, strictMode = false) {
  const content = (
    <I18nProvider>
      <EventRequestsHarness enabled={enabled} />
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

test("waits for the Event tab and avoids a duplicate Strict Mode request", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventRequestsResponse([firstEvent]);
  };
  const view = renderHarness(false, true);

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  view.rerender(
    <StrictMode>
      <I18nProvider>
        <EventRequestsHarness enabled />
      </I18nProvider>
    </StrictMode>,
  );

  await waitFor(() => assert.equal(requestCount, 1));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Event values").textContent ?? "",
      /Future of Publishing/,
    ),
  );
});

test("exposes loading, backend errors, and Retry success", async () => {
  const initialRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return initialRequest.promise;
    }

    return getEventRequestsResponse([firstEvent]);
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.equal(view.getByLabelText("Event loading").textContent, "loading"),
  );

  await act(async () => {
    initialRequest.resolve(
      new Response(JSON.stringify({ message: "Events unavailable." }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }),
    );
    await initialRequest.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByRole("alert").textContent, "Events unavailable."),
  );
  assert.equal(view.getByLabelText("Event values").textContent, "[]");

  fireEvent.click(view.getByRole("button", { name: "Retry events" }));

  await waitFor(() => assert.equal(requestCount, 2));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Event values").textContent ?? "",
      /Future of Publishing/,
    ),
  );
  assert.equal(view.queryByRole("alert"), null);
});

test("debounces title search and resets pagination for search and filters", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());
    const page = Number(url.searchParams.get("page"));

    return getEventRequestsResponse([firstEvent], page, 30, 2);
  };
  const view = renderHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));
  assert.equal(new URL(requestedUrls[1]).searchParams.get("page"), "2");

  fireEvent.change(view.getByLabelText("Event title search"), {
    target: { value: "Publishing" },
  });
  await act(async () => Promise.resolve());
  assert.equal(requestedUrls.length, 2);

  await waitFor(() => assert.equal(requestedUrls.length, 3), {
    timeout: 1200,
  });
  let latestUrl = new URL(requestedUrls[2]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[title]"), "Publishing");

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  const panel = view.getByRole("dialog", {
    name: "Event request filters",
  });
  const selects = panel.querySelectorAll("select");
  const dateInput = panel.querySelector('input[type="date"]');
  assert.ok(dateInput);

  fireEvent.change(selects[0], { target: { value: "approved" } });
  fireEvent.change(dateInput, { target: { value: "2026-07-21" } });
  fireEvent.change(selects[1], { target: { value: "-created_at" } });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(requestedUrls.length, 4));
  latestUrl = new URL(requestedUrls[3]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[title]"), "Publishing");
  assert.equal(latestUrl.searchParams.get("filter[status]"), "approved");
  assert.equal(
    latestUrl.searchParams.get("filter[created_date]"),
    "2026-07-21",
  );
  assert.equal(latestUrl.searchParams.get("sort"), "-created_at");

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear" }));

  await waitFor(() => assert.equal(requestedUrls.length, 5));
  latestUrl = new URL(requestedUrls[4]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[title]"), "Publishing");
  assert.equal(latestUrl.searchParams.has("filter[status]"), false);
  assert.equal(latestUrl.searchParams.has("filter[created_date]"), false);
  assert.equal(latestUrl.searchParams.has("sort"), false);
});

test("Retry preserves current parameters and stale searches cannot win", async () => {
  const olderRequest = createDeferred<Response>();
  const newerRequest = createDeferred<Response>();
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());

    if (requestedUrls.length === 1) {
      return getEventRequestsResponse([firstEvent]);
    }

    if (requestedUrls.length === 2) {
      return olderRequest.promise;
    }

    return newerRequest.promise;
  };
  const view = renderHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.change(view.getByLabelText("Event title search"), {
    target: { value: "Older" },
  });
  await waitFor(() => assert.equal(requestedUrls.length, 2), {
    timeout: 1200,
  });

  fireEvent.change(view.getByLabelText("Event title search"), {
    target: { value: "Newer" },
  });
  await waitFor(() => assert.equal(requestedUrls.length, 3), {
    timeout: 1200,
  });

  await act(async () => {
    newerRequest.resolve(getEventRequestsResponse([secondEvent]));
    await newerRequest.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Event values").textContent ?? "",
      /Modern Exhibition Design/,
    ),
  );

  await act(async () => {
    olderRequest.resolve(getEventRequestsResponse([firstEvent]));
    await olderRequest.promise;
  });
  assert.match(
    view.getByLabelText("Event values").textContent ?? "",
    /Modern Exhibition Design/,
  );

  const retryRequest = createDeferred<Response>();
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));
    return retryRequest.promise;
  };
  fireEvent.click(view.getByRole("button", { name: "Retry events" }));

  await waitFor(() => assert.equal(requestedUrls.length, 4));
  const retryUrl = new URL(requestedUrls[3]);
  assert.equal(retryUrl.searchParams.get("filter[title]"), "Newer");

  await act(async () => {
    retryRequest.resolve(getEventRequestsResponse([secondEvent]));
    await retryRequest.promise;
  });
});
