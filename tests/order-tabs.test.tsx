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
import { ar } from "../src/i18n/locales/ar.js";

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

function installPageFetch() {
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

  return {
    requestedPaths,
    wasRejected: () => wasRejected,
  };
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

test("Event requests render shared controls, preview data, search, and local pagination", async () => {
  const pageFetch = installPageFetch();
  const { requestedPaths } = pageFetch;

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
  const eventPanel = view.getByRole("tabpanel", { name: "Event" });
  const eventSearchInput = within(eventPanel).getByRole("searchbox", {
    name: "Search event requests",
  }) as HTMLInputElement;
  const eventFilterButton = within(eventPanel).getByRole("button", {
    name: "Open event request filters",
  });
  const eventTable = within(eventPanel).getByRole("region", {
    name: "Event requests",
  });
  const currentPageButton = within(eventPanel).getByRole("button", {
    current: "page",
    name: "1",
  });

  assert.equal(
    eventSearchInput.getAttribute("placeholder"),
    "Search event requests...",
  );
  assert.ok(eventFilterButton);
  assert.ok(eventTable);
  assert.equal(currentPageButton.getAttribute("aria-current"), "page");
  assert.ok(within(eventTable).getByText("The Future of Publishing"));
  assert.ok(within(eventTable).getByText("Request #3"));
  assert.ok(within(eventTable).getByLabelText("Event Request ID: 3"));
  assert.ok(within(eventTable).getByText("Event Hall #3"));
  const conferenceBadge = within(eventTable).getByText("Conference");
  assert.ok(
    conferenceBadge.classList.contains("event-request-table__type-badge"),
  );
  assert.equal(within(eventTable).queryByText("Event type:"), null);

  const approvedStatus = within(eventTable).getByLabelText(
    "Event status: Approved",
  );
  assert.ok(approvedStatus.classList.contains("order-status--approved"));

  const startCell = within(eventTable)
    .getByText("Start time")
    .closest(".data-table__cell");
  const endCell = within(eventTable)
    .getByText("End time")
    .closest(".data-table__cell");
  const createdCell = within(eventTable)
    .getByText("Created At")
    .closest(".data-table__cell");

  assert.ok(startCell?.classList.contains("event-request-table__cell--start"));
  assert.ok(endCell?.classList.contains("event-request-table__cell--end"));
  assert.ok(
    createdCell?.classList.contains("event-request-table__cell--created"),
  );
  assert.match(startCell?.textContent ?? "", /2026/);
  assert.match(endCell?.textContent ?? "", /2026/);
  assert.match(createdCell?.textContent ?? "", /2026/);
  assert.equal(within(eventTable).queryByText("Duration"), null);
  assert.equal(within(eventTable).queryByText("3 hours"), null);
  assert.equal(
    within(eventTable).queryByText("2026-07-24T11:00:00.000000Z"),
    null,
  );
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

  fireEvent.click(eventFilterButton);
  fireEvent.change(eventSearchInput, { target: { value: "conference" } });
  assert.ok(view.getByText("The Future of Publishing"));

  fireEvent.change(eventSearchInput, {
    target: { value: "no matching event" },
  });
  assert.ok(view.getByText("No event requests found."));
  assert.equal(view.queryByText("The Future of Publishing"), null);
  assert.equal(
    within(eventPanel).queryByRole("button", {
      current: "page",
      name: "1",
    }),
    null,
  );

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
  assert.equal(pageFetch.wasRejected(), true);
  assert.equal(
    requestedPaths.filter((path) =>
      path.endsWith("/booths/requests/reject/701"),
    ).length,
    1,
  );
});

test("Event requests render valid Arabic labels and localized values", async () => {
  window.localStorage.setItem("ems-language", "ar");
  const { requestedPaths } = installPageFetch();
  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  await waitFor(() => assert.equal(requestedPaths.length, 3));

  const eventTab = view.getByRole("tab", { name: ar.order.tabs.event });
  fireEvent.click(eventTab);

  const eventPanel = view.getByRole("tabpanel", {
    name: ar.order.tabs.event,
  });
  const eventTable = within(eventPanel).getByRole("region", {
    name: ar.order.eventRequests.table.ariaLabel,
  });

  assert.ok(
    within(eventPanel).getByRole("searchbox", {
      name: ar.order.eventRequests.filters.searchAriaLabel,
    }),
  );
  assert.ok(
    within(eventPanel).getByRole("button", {
      name: ar.order.eventRequests.filters.filterAriaLabel,
    }),
  );
  assert.ok(within(eventTable).getByText("The Future of Publishing"));
  assert.ok(
    within(eventTable).getByLabelText(
      `${ar.order.eventRequests.table.requestId}: 3`,
    ),
  );
  assert.ok(
    within(eventTable).getByText(
      `${ar.order.eventRequests.table.eventHallPrefix} #3`,
    ),
  );
  assert.ok(
    within(eventTable).getByText(
      ar.order.eventRequests.table.types.conference,
    ),
  );
  assert.ok(
    within(eventTable).getByLabelText(
      `${ar.order.eventRequests.table.eventStatus}: ${ar.order.status.approved}`,
    ),
  );
  const startCell = within(eventTable)
    .getByText(ar.order.eventRequests.table.startTime)
    .closest(".data-table__cell");
  const endCell = within(eventTable)
    .getByText(ar.order.eventRequests.table.endTime)
    .closest(".data-table__cell");
  const createdCell = within(eventTable)
    .getByText(ar.order.eventRequests.table.createdAt)
    .closest(".data-table__cell");

  assert.ok(startCell?.classList.contains("event-request-table__cell--start"));
  assert.ok(endCell?.classList.contains("event-request-table__cell--end"));
  assert.ok(
    createdCell?.classList.contains("event-request-table__cell--created"),
  );
  assert.equal(
    within(eventTable).queryByText(`${ar.order.eventRequests.table.eventType}:`),
    null,
  );
  assert.equal(within(eventTable).queryByText(/(?:٣|3)\s+ساعات/), null);

  const eventSearchInput = within(eventPanel).getByRole("searchbox", {
    name: ar.order.eventRequests.filters.searchAriaLabel,
  });
  fireEvent.change(eventSearchInput, {
    target: { value: ar.order.eventRequests.table.types.conference },
  });
  assert.ok(view.getByText("The Future of Publishing"));
  assert.equal(requestedPaths.some((path) => /event/i.test(path)), false);
});
