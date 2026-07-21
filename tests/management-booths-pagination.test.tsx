import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { ManagementPage } from "../src/features/management/pages/ManagementPage.js";
import type { BoothApiData } from "../src/features/management/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import { ar } from "../src/i18n/locales/ar.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function createBooth(id: number): BoothApiData {
  return {
    id,
    number: `SE_${String(id).padStart(2, "0")}`,
    qr_token: null,
    area: 18,
    price: `${400 + id}.00`,
    svg_id: `SE_${String(id).padStart(2, "0")}`,
    is_booked: id % 2 === 0,
    created_at: "2026-07-21T14:01:10.000000Z",
  };
}

function createBoothPage(page: number) {
  const startId = (page - 1) * 10 + 1;
  const itemCount = page === 47 ? 1 : 10;

  return Array.from({ length: itemCount }, (_, index) =>
    createBooth(startId + index),
  );
}

function boothsResponse(page: number, booths = createBoothPage(page)) {
  return jsonResponse({
    status: true,
    message: "Booths retrieved successfully.",
    data: {
      data: booths,
      current_page: page,
      per_page: 10,
      total: 461,
      last_page: 47,
    },
  });
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

function getProfileResponse() {
  return jsonResponse({
    status: true,
    message: "Success",
    data: {
      avatar: null,
      email: "admin@example.com",
      id: 1,
      is_verified: true,
      name: "Admin",
      type: "admin",
    },
  });
}

function getHallsResponse() {
  return jsonResponse({
    status: true,
    message: "Success",
    data: [
      {
        id: 1,
        number: "H_01",
        area: 100,
        type: "Exhibition",
        svg_id: "H_01",
      },
    ],
  });
}

function renderPage() {
  return render(
    <I18nProvider>
      <ManagementPage />
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
          ? JSON.stringify({ token: "management-page-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.lang = "";
  document.documentElement.dir = "";
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

test("Management Booth tab uses the shared footer for backend page navigation", async () => {
  const requestedBoothPages: number[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));

    if (url.pathname.endsWith("/profile")) {
      return getProfileResponse();
    }

    if (url.pathname.endsWith("/halls")) {
      return getHallsResponse();
    }

    if (url.pathname.endsWith("/booths")) {
      const page = Number(url.searchParams.get("page"));
      requestedBoothPages.push(page);
      return boothsResponse(page);
    }

    if (url.pathname.endsWith("/eventHall")) {
      return jsonResponse({ status: true, message: "Success", data: [] });
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const view = renderPage();

  await view.findByRole("region", { name: "Halls and booths" });
  assert.equal(view.container.querySelector(".management-page__footer"), null);

  fireEvent.click(view.getByRole("tab", { name: "Booth" }));
  const pageOneTable = await view.findByRole("region", { name: "Booths" });
  await view.findByText("SE_01");
  const getFooter = () => {
    const currentFooter = view.container.querySelector<HTMLElement>(
      ".management-page__footer",
    );

    assert.ok(currentFooter);
    return currentFooter;
  };
  const pageOneFooter = getFooter();

  assert.equal(pageOneFooter.previousElementSibling, pageOneTable);
  assert.equal(
    within(getFooter()).getByRole("button", { current: "page" }).textContent,
    "1",
  );
  assert.deepEqual(
    within(getFooter())
      .getAllByRole("button")
      .filter((button) => /^\d+$/.test(button.textContent ?? ""))
      .map((button) => button.textContent),
    ["1", "2", "3", "4", "5"],
  );

  fireEvent.click(within(getFooter()).getByRole("button", { name: "2" }));
  await view.findByText("SE_11");
  assert.equal(view.queryByText("SE_01"), null);
  assert.deepEqual(requestedBoothPages, [1, 2]);
  assert.equal(
    within(getFooter()).getByRole("button", { current: "page" }).textContent,
    "2",
  );

  fireEvent.click(
    within(getFooter()).getByRole("button", { name: "Next page" }),
  );
  await waitFor(() => assert.equal(requestedBoothPages.at(-1), 3));
  await view.findByText("SE_21");

  fireEvent.click(
    within(getFooter()).getByRole("button", { name: "Previous page" }),
  );
  await view.findByText("SE_11");
  assert.equal(requestedBoothPages.at(-1), 2);

  fireEvent.change(view.getByRole("searchbox", { name: "Search booths" }), {
    target: { value: "SE_99" },
  });
  await waitFor(() => assert.equal(requestedBoothPages.at(-1), 1));
  await view.findByText("No booths found.");
  assert.ok(view.container.querySelector(".management-page__footer"));

  fireEvent.change(view.getByRole("searchbox", { name: "Search booths" }), {
    target: { value: "" },
  });
  await view.findByText("SE_01");
  fireEvent.click(within(getFooter()).getByRole("button", { name: "2" }));
  await view.findByText("SE_11");
  fireEvent.click(view.getByRole("button", { name: "Open filters" }));
  let filterPanel = view.getByRole("dialog", { name: "Booth filters" });
  fireEvent.change(within(filterPanel).getByLabelText("Booth Number"), {
    target: { value: "SE_01" },
  });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestedBoothPages.at(-1), 1));
  await view.findByText("SE_01");

  fireEvent.click(within(getFooter()).getByRole("button", { name: "2" }));
  await view.findByText("No booths found.");
  fireEvent.click(view.getByRole("button", { name: "Open filters" }));
  filterPanel = view.getByRole("dialog", { name: "Booth filters" });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Clear" }));
  await waitFor(() => assert.equal(requestedBoothPages.at(-1), 1));
  await view.findByText("SE_01");

  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[0]);
  assert.ok(view.getByRole("dialog", { name: "Edit Booth" }));
  fireEvent.click(view.getByRole("button", { name: "Cancel" }));

  const boothRequestCount = requestedBoothPages.length;
  fireEvent.click(view.getByRole("tab", { name: "Hall" }));
  assert.equal(view.container.querySelector(".management-page__footer"), null);
  fireEvent.click(view.getByRole("button", { name: "Open filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear" }));
  assert.equal(requestedBoothPages.length, boothRequestCount);

  fireEvent.click(view.getByRole("tab", { name: "Event Hall" }));
  await view.findByText("No event halls found.");
  assert.equal(view.container.querySelector(".management-page__footer"), null);
  fireEvent.click(view.getByRole("button", { name: "Open filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear" }));
  assert.equal(requestedBoothPages.length, boothRequestCount);
});

test("Management Booth loading, error, retry, and empty states hide the footer", async () => {
  const firstBoothRequest = createDeferred<Response>();
  let boothRequestCount = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));

    if (url.pathname.endsWith("/profile")) {
      return getProfileResponse();
    }

    if (url.pathname.endsWith("/halls")) {
      return getHallsResponse();
    }

    if (url.pathname.endsWith("/booths")) {
      boothRequestCount += 1;

      if (boothRequestCount === 1) {
        return firstBoothRequest.promise;
      }

      return jsonResponse({
        status: true,
        message: "Booths retrieved successfully.",
        data: {
          data: [],
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
        },
      });
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const view = renderPage();

  fireEvent.click(view.getByRole("tab", { name: "Booth" }));
  await view.findByText("Loading booths...");
  assert.equal(view.container.querySelector(".management-page__footer"), null);

  await act(async () => {
    firstBoothRequest.resolve(
      jsonResponse({ message: "Booths unavailable." }, 503),
    );
    await firstBoothRequest.promise;
  });
  assert.equal(
    (await view.findByRole("alert")).textContent?.includes(
      "Booths unavailable.",
    ),
    true,
  );
  assert.equal(view.container.querySelector(".management-page__footer"), null);

  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  await view.findByText("No booths found.");
  assert.equal(boothRequestCount, 2);
  assert.equal(view.container.querySelector(".management-page__footer"), null);
});

test("Management Booth pagination remains available in Arabic RTL", async () => {
  window.localStorage.setItem("ems-language", "ar");
  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));

    if (url.pathname.endsWith("/profile")) {
      return getProfileResponse();
    }

    if (url.pathname.endsWith("/halls")) {
      return getHallsResponse();
    }

    if (url.pathname.endsWith("/booths")) {
      return boothsResponse(Number(url.searchParams.get("page")));
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  const view = renderPage();

  fireEvent.click(
    view.getByRole("tab", { name: ar.management.tabs.booth }),
  );
  await waitFor(() =>
    assert.ok(view.container.querySelector(".management-page__footer")),
  );
  assert.equal(document.documentElement.lang, "ar");
  assert.equal(document.documentElement.dir, "rtl");
  assert.ok(
    view.getByRole("button", { name: ar.common.nextPage }),
  );
});
