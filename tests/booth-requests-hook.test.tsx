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
import { useBoothRequests } from "../src/features/order/hooks/useBoothRequests.js";
import type { BoothRequestApiData } from "../src/features/order/types.js";
import {
  I18nProvider,
  useI18n,
} from "../src/i18n/I18nContext.js";

const darAlFekerRequest: BoothRequestApiData = {
  id: 1,
  booth_id: 9,
  company_id: 37,
  company_name: "Dar Al Feker",
  status: "approved",
  reason_for_booking: "",
  final_price: 250,
  created_at: "2026-07-14 10:01:00",
};

const greenFoodsRequest: BoothRequestApiData = {
  id: 3,
  booth_id: 4,
  company_id: 2,
  company_name: "GreenFoods Co.",
  status: "pending",
  reason_for_booking: "",
  final_price: 200,
  created_at: "2026-07-21 12:01:01",
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getBoothRequestsResponse(
  items: BoothRequestApiData[],
  currentPage = 1,
  total = items.length,
  lastPage = Math.max(1, Math.ceil(total / 5)),
) {
  return new Response(
    JSON.stringify({
      status: true,
      message: "Success",
      data: {
        data: items,
        current_page: currentPage,
        per_page: 5,
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

function BoothRequestsHarness() {
  const { t } = useI18n();
  const state = useBoothRequests();

  return (
    <div>
      <input
        aria-label="Company name search"
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
        Retry booth requests
      </button>

      <output aria-label="Booth values">{JSON.stringify(state.requests)}</output>
      <output aria-label="Booth page">{state.currentPage}</output>

      {state.filters.isFilterPanelOpen ? (
        <OrderFiltersPanel
          filters={state.filters.draftFilters}
          onApply={state.filters.applyFilters}
          onChange={state.filters.setDraftFilters}
          onClear={state.filters.clearFilters}
        />
      ) : null}

      {state.error ? <p role="alert">{state.error || t.order.table.loadError}</p> : null}
    </div>
  );
}

function renderHarness(strictMode = false) {
  const content = (
    <I18nProvider>
      <BoothRequestsHarness />
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

test("debounces company search through the backend and composes request filters", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());
    const companyName = url.searchParams.get("filter[company.name]");
    const page = Number(url.searchParams.get("page"));

    return companyName === "GreenFoods"
      ? getBoothRequestsResponse([greenFoodsRequest], page, 1, 1)
      : getBoothRequestsResponse([darAlFekerRequest], page, 10, 2);
  };
  const view = renderHarness();

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /Dar Al Feker/,
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));
  assert.equal(new URL(requestedUrls[1]).searchParams.get("page"), "2");

  fireEvent.change(view.getByLabelText("Company name search"), {
    target: { value: "  GreenFoods  " },
  });
  await act(async () => Promise.resolve());
  assert.equal(requestedUrls.length, 2);

  await waitFor(() => assert.equal(requestedUrls.length, 3), {
    timeout: 1200,
  });
  let latestUrl = new URL(requestedUrls[2]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[company.name]"), "GreenFoods");
  assert.equal(latestUrl.searchParams.has("filter[name]"), false);
  assert.equal(latestUrl.searchParams.has("filter[company_name]"), false);
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /GreenFoods Co\./,
    ),
  );

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  const panel = view.getByRole("dialog", { name: "Booth request filters" });
  const selects = panel.querySelectorAll("select");
  const dateInput = panel.querySelector('input[type="date"]');
  assert.ok(dateInput);

  fireEvent.change(selects[0], { target: { value: "pending" } });
  fireEvent.change(dateInput, { target: { value: "2026-07-21" } });
  fireEvent.change(selects[1], { target: { value: "-created_at" } });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(requestedUrls.length, 4));
  latestUrl = new URL(requestedUrls[3]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[company.name]"), "GreenFoods");
  assert.equal(latestUrl.searchParams.get("filter[status]"), "pending");
  assert.equal(latestUrl.searchParams.get("filter[created_date]"), "2026-07-21");
  assert.equal(latestUrl.searchParams.get("sort"), "-created_at");

  fireEvent.change(view.getByLabelText("Company name search"), {
    target: { value: "" },
  });

  await waitFor(() => assert.equal(requestedUrls.length, 5), {
    timeout: 1200,
  });
  latestUrl = new URL(requestedUrls[4]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.has("filter[company.name]"), false);
  assert.equal(latestUrl.searchParams.get("filter[status]"), "pending");
  assert.equal(latestUrl.searchParams.get("filter[created_date]"), "2026-07-21");
  assert.equal(latestUrl.searchParams.get("sort"), "-created_at");
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /Dar Al Feker/,
    ),
  );
});

test("does not allow stale company search results to replace newer results", async () => {
  const olderRequest = createDeferred<Response>();
  const newerRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return getBoothRequestsResponse([darAlFekerRequest]);
    }

    return requestCount === 2 ? olderRequest.promise : newerRequest.promise;
  };
  const view = renderHarness();

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.change(view.getByLabelText("Company name search"), {
    target: { value: "Older" },
  });
  await waitFor(() => assert.equal(requestCount, 2), { timeout: 1200 });

  fireEvent.change(view.getByLabelText("Company name search"), {
    target: { value: "Newer" },
  });
  await waitFor(() => assert.equal(requestCount, 3), { timeout: 1200 });

  await act(async () => {
    newerRequest.resolve(getBoothRequestsResponse([greenFoodsRequest]));
    await newerRequest.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /GreenFoods Co\./,
    ),
  );

  await act(async () => {
    olderRequest.resolve(getBoothRequestsResponse([darAlFekerRequest]));
    await olderRequest.promise;
  });
  assert.match(
    view.getByLabelText("Booth values").textContent ?? "",
    /GreenFoods Co\./,
  );
});

test("avoids duplicate initial requests in Strict Mode", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getBoothRequestsResponse([darAlFekerRequest]);
  };

  renderHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
});
