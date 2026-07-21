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
import { OrderPage } from "../src/features/order/pages/OrderPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const boothRequest = {
  booth_id: 12,
  company_id: 37,
  created_at: "2026-07-14 10:01:00",
  final_price: 250,
  id: 701,
  reason_for_booking: "Exhibition booth booking.",
  status: "pending" as const,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function getProfileResponse() {
  return jsonResponse({
    status: true,
    message: "profile retrieved successfully",
    data: {
      avatar: null,
      email: "admin@example.com",
      id: 1,
      is_verified: true,
      name: "Test Admin",
      type: "admin",
    },
  });
}

function getBoothRequestsResponse() {
  return jsonResponse({
    status: true,
    message: "booth requests retrieved successfully",
    data: {
      current_page: 1,
      data: [boothRequest],
      last_page: 1,
      per_page: 5,
      total: 1,
    },
  });
}

function getStatisticsResponse() {
  return jsonResponse({
    status: true,
    message: "booth request statistics retrieved successfully",
    data: {
      approved_requests: 0,
      pending_requests: 1,
      total_requests: 1,
    },
  });
}

function getDetailsResponse(status: "pending" | "rejected") {
  return jsonResponse({
    status: true,
    message: "booth request retrieved successfully",
    data: {
      ...boothRequest,
      status,
      company: {
        business_sector: "Events",
        description: "Exhibitor company",
        gallery: [],
        headquarters_lat: 33.5,
        headquarters_lng: 36.2,
        id: 37,
        logo: "",
        name: "Damascus Expo",
        phone: "+963111111111",
        social_links: {
          linkedin: "",
          website: "",
        },
        status: "approved",
        year_founded: 2020,
      },
      services: [],
    },
  });
}

function getRequestedUrl(input: RequestInfo | URL) {
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
          ? JSON.stringify({ token: "order-tabs-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
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

test("Orders tabs switch between preserved Booth UI and the translated Event placeholder", async () => {
  const requestedPaths: string[] = [];
  let wasRejected = false;

  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));
    requestedPaths.push(url.pathname);

    if (url.pathname.endsWith("/profile")) {
      return getProfileResponse();
    }

    if (url.pathname.endsWith("/booths/requests/stats")) {
      return getStatisticsResponse();
    }

    if (url.pathname.endsWith("/booths/requests/reject/701")) {
      assert.equal(init?.method, "PATCH");
      wasRejected = true;
      return jsonResponse({
        status: true,
        message: "request rejected successfully",
        data: null,
      });
    }

    if (url.pathname.endsWith("/booths/requests/701")) {
      return getDetailsResponse(wasRejected ? "rejected" : "pending");
    }

    if (url.pathname.endsWith("/booths/requests")) {
      return getBoothRequestsResponse();
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  const tabList = view.getByRole("tablist", {
    name: "Order request categories",
  });
  const boothTab = within(tabList).getByRole("tab", { name: "Booth" });
  const eventTab = within(tabList).getByRole("tab", { name: "Event" });

  assert.equal(boothTab.getAttribute("aria-selected"), "true");
  assert.equal(eventTab.getAttribute("aria-selected"), "false");
  assert.equal(boothTab.getAttribute("aria-controls"), "orders-booth-panel");
  assert.equal(eventTab.getAttribute("aria-controls"), "orders-event-panel");

  await view.findByRole("button", {
    name: "View details for Company #37",
  });
  assert.ok(view.getByRole("tabpanel", { name: "Booth" }));
  assert.ok(view.getByRole("searchbox", { name: "Search requests" }));

  await waitFor(() => assert.equal(requestedPaths.length, 3));
  const initialRequestCount = requestedPaths.length;
  const searchInput = view.getByRole("searchbox", {
    name: "Search requests",
  }) as HTMLInputElement;
  fireEvent.change(searchInput, { target: { value: "preserved search" } });

  fireEvent.click(eventTab);

  assert.equal(boothTab.getAttribute("aria-selected"), "false");
  assert.equal(eventTab.getAttribute("aria-selected"), "true");
  assert.ok(view.getByRole("tabpanel", { name: "Event" }));
  assert.ok(view.getByText("Event requests are not connected yet."));
  assert.equal(
    view.queryByRole("button", {
      name: "View details for Company #37",
    }),
    null,
  );
  assert.equal(
    view.queryByRole("searchbox", { name: "Search requests" }),
    null,
  );
  assert.equal(view.queryByText("Total Requests"), null);

  await act(async () => Promise.resolve());
  assert.equal(requestedPaths.length, initialRequestCount);
  assert.equal(requestedPaths.some((path) => /event/i.test(path)), false);

  fireEvent.click(boothTab);

  const restoredSearchInput = view.getByRole("searchbox", {
    name: "Search requests",
  }) as HTMLInputElement;
  assert.equal(restoredSearchInput.value, "preserved search");
  const restoredBoothRow = view.getByRole("button", {
    name: "View details for Company #37",
  });
  assert.equal(requestedPaths.length, initialRequestCount);

  fireEvent.click(restoredBoothRow);
  await view.findByRole("heading", { name: "Damascus Expo" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  fireEvent.click(view.getByRole("button", { name: "Reject Request" }));

  assert.ok(await view.findByRole("status", { name: "Rejected" }));
  assert.equal(wasRejected, true);
  assert.equal(
    requestedPaths.filter((path) =>
      path.endsWith("/booths/requests/reject/701"),
    ).length,
    1,
  );
});
