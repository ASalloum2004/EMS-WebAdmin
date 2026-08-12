import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { ReportFiltersPanel } from "../src/features/reports/components/ReportFiltersPanel/ReportFiltersPanel.js";
import { useReports } from "../src/features/reports/hooks/useReports.js";
import type { ReportApiData } from "../src/features/reports/types.js";
import {
  I18nProvider,
  useI18n,
} from "../src/i18n/I18nContext.js";

const pendingReport: ReportApiData = {
  admin_notes: null,
  created_at: "2026-08-12T10:52:59.000000Z",
  description: "Backend-only description.",
  id: 1,
  status: "pending",
  title: "Outdated information",
};

const rejectedReport: ReportApiData = {
  ...pendingReport,
  id: 2,
  status: "rejected",
  title: "Content needs clarification",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getReportsResponse(
  items: ReportApiData[],
  currentPage = 1,
  total = items.length,
  lastPage = Math.max(1, Math.ceil(total / 4)),
) {
  return new Response(
    JSON.stringify({
      data: {
        current_page: currentPage,
        data: items,
        last_page: lastPage,
        per_page: 4,
        total,
      },
      message: "Success",
      status: true,
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

function ReportsHarness() {
  const { t } = useI18n();
  const state = useReports(t.reports.table.loadError);

  return (
    <div>
      <input
        aria-label="Report search"
        onChange={(event) => state.setSearchValue(event.target.value)}
        value={state.searchValue}
      />
      <button onClick={() => state.setCurrentPage(2)} type="button">
        Page two
      </button>
      <button onClick={state.filters.toggleFilterPanel} type="button">
        Toggle report filters
      </button>
      <button onClick={() => void state.refetch()} type="button">
        Retry reports
      </button>

      <output aria-label="Reports loading">
        {state.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Report values">
        {JSON.stringify(state.reports)}
      </output>
      <output aria-label="Report page">{state.currentPage}</output>

      {state.filters.isFilterPanelOpen ? (
        <ReportFiltersPanel
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

function renderHarness() {
  return render(
    <I18nProvider>
      <ReportsHarness />
    </I18nProvider>,
  );
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
          ? JSON.stringify({ token: "reports-hook-test-token" })
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

test("exposes initial loading, backend errors, and Retry success", async () => {
  const initialRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    return requestCount === 1
      ? initialRequest.promise
      : getReportsResponse([pendingReport]);
  };
  const view = renderHarness();

  await waitFor(() =>
    assert.equal(view.getByLabelText("Reports loading").textContent, "loading"),
  );

  await act(async () => {
    initialRequest.resolve(
      new Response(JSON.stringify({ message: "Reports unavailable." }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }),
    );
    await initialRequest.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByRole("alert").textContent, "Reports unavailable."),
  );
  assert.equal(view.getByLabelText("Report values").textContent, "[]");

  fireEvent.click(view.getByRole("button", { name: "Retry reports" }));

  await waitFor(() => assert.equal(requestCount, 2));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Report values").textContent ?? "",
      /Outdated information/,
    ),
  );
  assert.equal(view.queryByRole("alert"), null);
});

test("debounces search and resets server pagination for search and status", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());
    const page = Number(url.searchParams.get("page"));
    const hasCriteria =
      url.searchParams.has("filter[search]") ||
      url.searchParams.has("filter[status]");

    return getReportsResponse(
      hasCriteria ? [rejectedReport] : [pendingReport],
      page,
      10,
      3,
    );
  };
  const view = renderHarness();

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));
  assert.equal(new URL(requestedUrls[1]).searchParams.get("page"), "2");

  fireEvent.change(view.getByLabelText("Report search"), {
    target: { value: "  clarification  " },
  });
  await act(async () => Promise.resolve());
  assert.equal(requestedUrls.length, 2);

  await waitFor(() => assert.equal(requestedUrls.length, 3), {
    timeout: 1200,
  });
  let latestUrl = new URL(requestedUrls[2]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(
    latestUrl.searchParams.get("filter[search]"),
    "clarification",
  );

  fireEvent.click(
    view.getByRole("button", { name: "Toggle report filters" }),
  );
  fireEvent.change(view.getByRole("combobox"), {
    target: { value: "rejected" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(requestedUrls.length, 4));
  latestUrl = new URL(requestedUrls[3]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[status]"), "rejected");
  assert.equal(latestUrl.searchParams.get("per_page"), "4");

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Report values").textContent ?? "",
      /Content needs clarification/,
    ),
  );
});
