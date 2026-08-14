import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import { ManagementPage } from "../src/features/management/pages/ManagementPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
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
          ? JSON.stringify({ token: "management-bus-test-token" })
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

test("Bus modal loads backend rows and sends the location filter", async () => {
  const requestedUrls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(getRequestUrl(input));
    requestedUrls.push(url.toString());

    if (url.pathname.endsWith("/profile")) {
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

    if (url.pathname.endsWith("/halls")) {
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

    if (url.pathname.endsWith("/buses")) {
      const isFiltered = url.searchParams.get("filter[location]") === "Homs";

      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          data: [
            {
              id: isFiltered ? 2 : 1,
              location: isFiltered ? "Homs" : "Damascus",
              start_time: "08:00:00",
              end_time: "21:00:00",
              duration: 45,
            },
          ],
          current_page: 1,
          per_page: 3,
          total: 1,
          last_page: 1,
        },
      });
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const view = render(
    <I18nProvider>
      <ManagementPage />
    </I18nProvider>,
  );

  await view.findByRole("region", { name: "Halls and booths" });
  fireEvent.click(view.getByRole("button", { name: "Bus" }));

  const busDialog = await view.findByRole("dialog", { name: "Bus Management" });
  assert.ok(within(busDialog).getByText("Damascus"));
  assert.equal(within(busDialog).queryByText("1"), null);

  fireEvent.change(
    within(busDialog).getByRole("searchbox", { name: "Search buses" }),
    { target: { value: "Homs" } },
  );

  await waitFor(() => assert.ok(within(busDialog).getByText("Homs")));

  const filteredRequest = requestedUrls
    .map((value) => new URL(value))
    .find((url) => url.searchParams.get("filter[location]") === "Homs");

  assert.ok(filteredRequest);
  assert.equal(filteredRequest.searchParams.get("filter[location]"), "Homs");
  assert.equal(filteredRequest.searchParams.has("search"), false);
  assert.equal(filteredRequest.searchParams.has("filter[search]"), false);
  assert.equal(filteredRequest.searchParams.has("location"), false);
  assert.equal(filteredRequest.searchParams.has("query"), false);
});
