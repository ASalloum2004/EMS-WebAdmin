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
import { useBooths } from "../src/features/management/hooks/useBooths.js";
import { BOOTH_SEARCH_DEBOUNCE_MS } from "../src/features/management/hooks/useBoothFiltering.js";
import type { BoothApiData } from "../src/features/management/types.js";

function createBooth(id: number, price = `${400 + id}.00`): BoothApiData {
  return {
    id,
    number: `SE_${String(id).padStart(2, "0")}`,
    qr_token: null,
    area: 18,
    price,
    svg_id: `SE_${String(id).padStart(2, "0")}`,
    is_booked: false,
    created_at: "2026-07-21T14:01:10.000000Z",
  };
}

function getBoothsResponse(
  booths: BoothApiData[],
  currentPage = 1,
  total = 461,
  lastPage = 47,
  perPage = 10,
) {
  return new Response(
    JSON.stringify({
      status: true,
      message: "Booths retrieved successfully.",
      data: {
        data: booths,
        current_page: currentPage,
        per_page: perPage,
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function BoothsHarness({ enabled }: { enabled: boolean }) {
  const state = useBooths({ enabled });

  return (
    <div>
      <input
        aria-label="Booth number search"
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
        Retry booths
      </button>
      <button
        onClick={() => {
          const visibleBooth = state.booths[0];

          if (visibleBooth) {
            void state.updateBoothById(visibleBooth.id, {
              area: visibleBooth.area,
              number: visibleBooth.number,
              price: 999,
            });
          }
        }}
        type="button"
      >
        Update visible booth
      </button>

      {state.filters.isFilterPanelOpen ? (
        <div aria-label="Booth filters" role="dialog">
          <input
            aria-label="Draft booth number"
            onChange={(event) =>
              state.filters.setDraftFilters({
                ...state.filters.draftFilters,
                number: event.target.value,
              })
            }
            value={state.filters.draftFilters.number}
          />
          <select
            aria-label="Draft booking status"
            onChange={(event) =>
              state.filters.setDraftFilters({
                ...state.filters.draftFilters,
                booked: event.target.value as
                  | ""
                  | "booked"
                  | "available",
              })
            }
            value={state.filters.draftFilters.booked}
          >
            <option value="">All</option>
            <option value="booked">Booked</option>
            <option value="available">Available</option>
          </select>
          {(["minArea", "maxArea", "minPrice", "maxPrice"] as const).map(
            (field) => (
              <input
                aria-label={`Draft ${field}`}
                key={field}
                onChange={(event) =>
                  state.filters.setDraftFilters({
                    ...state.filters.draftFilters,
                    [field]: event.target.value,
                  })
                }
                value={state.filters.draftFilters[field]}
              />
            ),
          )}
          <button onClick={state.filters.applyFilters} type="button">
            Apply filters
          </button>
          <button onClick={state.filters.clearFilters} type="button">
            Clear filters
          </button>
        </div>
      ) : null}

      <output aria-label="Booth loading">
        {state.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Booth values">
        {JSON.stringify(state.booths)}
      </output>
      <output aria-label="Booth page">{state.currentPage}</output>
      <output aria-label="Booth page size">{state.perPage}</output>
      <output aria-label="Booth total">{state.totalItems}</output>
      <output aria-label="Booth pages">{state.totalPages}</output>
      {state.error ? <p role="alert">{state.error}</p> : null}
    </div>
  );
}

function renderHarness(enabled: boolean, strictMode = false) {
  const content = <BoothsHarness enabled={enabled} />;

  return render(strictMode ? <StrictMode>{content}</StrictMode> : content);
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
          ? JSON.stringify({ token: "booths-hook-token" })
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

test("waits for the Booth tab and avoids a duplicate Strict Mode request", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getBoothsResponse([createBooth(1)]);
  };
  const view = renderHarness(false, true);

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  view.rerender(
    <StrictMode>
      <BoothsHarness enabled />
    </StrictMode>,
  );

  await waitFor(() => assert.equal(requestCount, 1));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
});

test("page two replaces page-one rows and refreshes backend metadata", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());
    const page = Number(url.searchParams.get("page"));

    return page === 2
      ? getBoothsResponse([createBooth(11)], 2, 462, 47)
      : getBoothsResponse([createBooth(1)]);
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Page two" }));

  await waitFor(() => assert.equal(requestedUrls.length, 2));
  assert.equal(new URL(requestedUrls[1]).searchParams.get("page"), "2");
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_11/,
    ),
  );
  assert.doesNotMatch(
    view.getByLabelText("Booth values").textContent ?? "",
    /SE_01/,
  );
  assert.equal(view.getByLabelText("Booth page").textContent, "2");
  assert.equal(view.getByLabelText("Booth page size").textContent, "10");
  assert.equal(view.getByLabelText("Booth total").textContent, "462");
  assert.equal(view.getByLabelText("Booth pages").textContent, "47");
});

test("debounces Booth Number search and composes applied filters across pagination and retry", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());
    const page = Number(url.searchParams.get("page"));
    const isFiltered = Array.from(url.searchParams.keys()).some((key) =>
      key.startsWith("filter["),
    );

    return getBoothsResponse(
      [createBooth(page === 2 ? 11 : 6)],
      page,
      isFiltered ? 12 : 461,
      isFiltered ? 2 : 47,
    );
  };
  const view = renderHarness(true);

  assert.equal(BOOTH_SEARCH_DEBOUNCE_MS, 400);
  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));

  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "SE" },
  });
  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "  SE_06  " },
  });
  await act(async () => Promise.resolve());
  assert.equal(requestedUrls.length, 2);

  await waitFor(() => assert.equal(requestedUrls.length, 3), {
    timeout: 1200,
  });
  let latestUrl = new URL(requestedUrls[2]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[number]"), "SE_06");
  assert.equal(latestUrl.searchParams.has("search"), false);
  assert.equal(latestUrl.searchParams.has("filter[id]"), false);
  assert.equal(view.getByLabelText("Booth total").textContent, "12");
  assert.equal(view.getByLabelText("Booth pages").textContent, "2");

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  assert.equal(
    (view.getByLabelText("Draft booth number") as HTMLInputElement).value,
    "  SE_06  ",
  );
  fireEvent.change(view.getByLabelText("Draft booth number"), {
    target: { value: "  SE_07  " },
  });
  fireEvent.change(view.getByLabelText("Draft booking status"), {
    target: { value: "available" },
  });
  fireEvent.change(view.getByLabelText("Draft minArea"), {
    target: { value: "20" },
  });
  fireEvent.change(view.getByLabelText("Draft maxArea"), {
    target: { value: "25" },
  });
  fireEvent.change(view.getByLabelText("Draft minPrice"), {
    target: { value: "500" },
  });
  fireEvent.change(view.getByLabelText("Draft maxPrice"), {
    target: { value: "625" },
  });
  await act(async () => Promise.resolve());
  assert.equal(requestedUrls.length, 3);

  fireEvent.click(view.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => assert.equal(requestedUrls.length, 4));
  latestUrl = new URL(requestedUrls[3]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[number]"), "SE_07");
  assert.equal(latestUrl.searchParams.get("filter[booked]"), "false");
  assert.equal(latestUrl.searchParams.get("filter[min_area]"), "20");
  assert.equal(latestUrl.searchParams.get("filter[max_area]"), "25");
  assert.equal(latestUrl.searchParams.get("filter[min_price]"), "500");
  assert.equal(latestUrl.searchParams.get("filter[max_price]"), "625");
  assert.equal(
    (view.getByLabelText("Booth number search") as HTMLInputElement).value,
    "SE_07",
  );

  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 5));
  latestUrl = new URL(requestedUrls[4]);
  assert.equal(latestUrl.searchParams.get("page"), "2");
  assert.equal(latestUrl.searchParams.get("filter[number]"), "SE_07");
  assert.equal(latestUrl.searchParams.get("filter[booked]"), "false");
  assert.equal(latestUrl.searchParams.get("filter[min_area]"), "20");

  fireEvent.click(view.getByRole("button", { name: "Retry booths" }));
  await waitFor(() => assert.equal(requestedUrls.length, 6));
  assert.equal(requestedUrls[5], requestedUrls[4]);

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  fireEvent.change(view.getByLabelText("Draft booking status"), {
    target: { value: "booked" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply filters" }));
  await waitFor(() => assert.equal(requestedUrls.length, 7));
  latestUrl = new URL(requestedUrls[6]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(latestUrl.searchParams.get("filter[booked]"), "true");

  fireEvent.click(view.getByRole("button", { name: "Toggle filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => assert.equal(requestedUrls.length, 8));
  latestUrl = new URL(requestedUrls[7]);
  assert.equal(latestUrl.searchParams.get("page"), "1");
  assert.equal(
    Array.from(latestUrl.searchParams.keys()).some((key) =>
      key.startsWith("filter["),
    ),
    false,
  );
  assert.equal(
    (view.getByLabelText("Booth number search") as HTMLInputElement).value,
    "",
  );
});

test("a slow page-one retry cannot overwrite a newer page-two response", async () => {
  const slowPageOne = createDeferred<Response>();
  const pageTwo = createDeferred<Response>();
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());

    if (requestedUrls.length === 1) {
      return getBoothsResponse([createBooth(1)]);
    }

    return requestedUrls.length === 2
      ? slowPageOne.promise
      : pageTwo.promise;
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Retry booths" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() => assert.equal(requestedUrls.length, 3));

  await act(async () => {
    pageTwo.resolve(getBoothsResponse([createBooth(11)], 2));
    await pageTwo.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_11/,
    ),
  );

  await act(async () => {
    slowPageOne.resolve(getBoothsResponse([createBooth(2)], 1));
    await slowPageOne.promise;
  });
  assert.match(
    view.getByLabelText("Booth values").textContent ?? "",
    /SE_11/,
  );
  assert.equal(view.getByLabelText("Booth page").textContent, "2");
});

test("a stale Booth Number search cannot overwrite newer filtered rows or metadata", async () => {
  const olderSearch = createDeferred<Response>();
  const newerSearch = createDeferred<Response>();
  let requestCount = 0;

  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return getBoothsResponse([createBooth(1)]);
    }

    return requestCount === 2 ? olderSearch.promise : newerSearch.promise;
  };
  const view = renderHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "SE_02" },
  });
  await waitFor(() => assert.equal(requestCount, 2), { timeout: 1200 });
  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "SE_03" },
  });
  await waitFor(() => assert.equal(requestCount, 3), { timeout: 1200 });

  await act(async () => {
    newerSearch.resolve(getBoothsResponse([createBooth(3)], 1, 1, 1));
    await newerSearch.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_03/,
    ),
  );

  await act(async () => {
    olderSearch.resolve(getBoothsResponse([createBooth(2)], 1, 10, 1));
    await olderSearch.promise;
  });
  assert.match(
    view.getByLabelText("Booth values").textContent ?? "",
    /SE_03/,
  );
  assert.equal(view.getByLabelText("Booth total").textContent, "1");
});

test("disabling Booth invalidates a pending request", async () => {
  const pendingRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return requestCount === 1
      ? getBoothsResponse([createBooth(1)])
      : pendingRequest.promise;
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "SE_02" },
  });
  await waitFor(() => assert.equal(requestCount, 2), { timeout: 1200 });
  view.rerender(<BoothsHarness enabled={false} />);

  await act(async () => {
    pendingRequest.resolve(getBoothsResponse([createBooth(2)], 1, 1, 1));
    await pendingRequest.promise;
  });
  assert.match(
    view.getByLabelText("Booth values").textContent ?? "",
    /SE_01/,
  );
  assert.equal(view.getByLabelText("Booth loading").textContent, "idle");
});

test("Retry requests the selected page after an error", async () => {
  const requestedPages: string[] = [];
  let pageTwoAttempts = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    const page = url.searchParams.get("page") ?? "";
    requestedPages.push(page);

    if (page === "2") {
      pageTwoAttempts += 1;

      if (pageTwoAttempts === 1) {
        return new Response(JSON.stringify({ message: "Booths unavailable." }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        });
      }

      return getBoothsResponse([createBooth(11)], 2);
    }

    return getBoothsResponse([createBooth(1)]);
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  assert.ok(await view.findByRole("alert"));
  assert.equal(view.getByLabelText("Booth page").textContent, "2");

  fireEvent.click(view.getByRole("button", { name: "Retry booths" }));
  await waitFor(() => assert.deepEqual(requestedPages, ["1", "2", "2"]));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_11/,
    ),
  );
  assert.equal(view.queryByRole("alert"), null);
  assert.equal(view.getByLabelText("Booth page").textContent, "2");
});

test("editing a visible Booth refetches with the active page and filters", async () => {
  let getRequestCount = 0;
  const requestedGetUrls: string[] = [];
  let hasUpdated = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestUrl(input));

    if (init?.method === "PATCH") {
      hasUpdated = true;
      return new Response(
        JSON.stringify({
          status: true,
          message: "Booth updated successfully.",
          data: createBooth(11, "999.00"),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    getRequestCount += 1;
    requestedGetUrls.push(url.toString());
    const page = Number(url.searchParams.get("page"));
    return page === 2
      ? getBoothsResponse(
          [createBooth(11, hasUpdated ? "999.00" : undefined)],
          2,
        )
      : getBoothsResponse([createBooth(1)]);
  };
  const view = renderHarness(true);

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_01/,
    ),
  );
  fireEvent.change(view.getByLabelText("Booth number search"), {
    target: { value: "SE_11" },
  });
  await waitFor(() => assert.equal(getRequestCount, 2), { timeout: 1200 });
  fireEvent.click(view.getByRole("button", { name: "Page two" }));
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /SE_11/,
    ),
  );
  fireEvent.click(
    view.getByRole("button", { name: "Update visible booth" }),
  );

  await waitFor(() =>
    assert.match(
      view.getByLabelText("Booth values").textContent ?? "",
      /999\.00/,
    ),
  );
  assert.equal(getRequestCount, 4);
  assert.equal(requestedGetUrls[3], requestedGetUrls[2]);
  assert.equal(
    new URL(requestedGetUrls[3]).searchParams.get("filter[number]"),
    "SE_11",
  );
  assert.equal(view.getByLabelText("Booth page").textContent, "2");
  assert.equal(view.getByLabelText("Booth total").textContent, "461");
  assert.equal(view.getByLabelText("Booth pages").textContent, "47");
});
