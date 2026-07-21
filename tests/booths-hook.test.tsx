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
      <button onClick={() => state.setCurrentPage(2)} type="button">
        Page two
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

test("editing a visible Booth preserves the active page and metadata", async () => {
  let getRequestCount = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestUrl(input));

    if (init?.method === "PATCH") {
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
    const page = Number(url.searchParams.get("page"));
    return page === 2
      ? getBoothsResponse([createBooth(11)], 2)
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
  assert.equal(getRequestCount, 2);
  assert.equal(view.getByLabelText("Booth page").textContent, "2");
  assert.equal(view.getByLabelText("Booth total").textContent, "461");
  assert.equal(view.getByLabelText("Booth pages").textContent, "47");
});
