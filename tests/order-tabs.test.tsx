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
import type {
  EventRequestApiData,
  EventRequestDetailsApiData,
} from "../src/features/order/types.js";
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

const eventRequests: EventRequestApiData[] = [
  {
    id: 301,
    title: "Backend Publishing Forum",
    event_hall_id: 31,
    type: "conference",
    status: "approved",
    start_at: "2026-07-24T11:00:00.000000Z",
    end_at: "2026-07-24T14:00:00.000000Z",
    duration: 3,
    description: "NON_UI_DESCRIPTION_VALUE",
    qr_token: "NON_UI_QR_VALUE",
    created_at: "2026-07-21T08:00:55.000000Z",
    logo: "NON_UI_LOGO_VALUE",
  },
  {
    id: 302,
    title: "Backend Author Lecture",
    event_hall_id: 32,
    type: "lecture",
    status: "pending",
    start_at: "2026-07-25T09:00:00.000000Z",
    end_at: "2026-07-25T10:00:00.000000Z",
    duration: 1,
    description: "Lecture backend description.",
    qr_token: null,
    created_at: "2026-07-21T09:00:00.000000Z",
    logo: null,
  },
  {
    id: 303,
    title: "Backend Editing Workshop",
    event_hall_id: 33,
    type: "workshop",
    status: "rejected",
    start_at: "2026-07-26T09:00:00.000000Z",
    end_at: "2026-07-26T12:00:00.000000Z",
    duration: 3,
    description: "Workshop backend description.",
    qr_token: null,
    created_at: "2026-07-21T10:00:00.000000Z",
    logo: null,
  },
  {
    id: 304,
    title: "Backend Community Gathering",
    event_hall_id: 34,
    type: "other",
    status: "approved",
    start_at: "2026-07-27T09:00:00.000000Z",
    end_at: "2026-07-27T11:00:00.000000Z",
    duration: 2,
    description: "Other backend description.",
    qr_token: null,
    created_at: "2026-07-21T11:00:00.000000Z",
    logo: null,
  },
];

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

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
      email: "",
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

function getEventRequestsResponse(
  items = eventRequests,
  currentPage = 1,
  total = 20,
  lastPage = 2,
) {
  return jsonResponse({
    status: true,
    message: "Success",
    data: {
      current_page: currentPage,
      data: items,
      last_page: lastPage,
      per_page: 15,
      total,
    },
  });
}

function getEventRequestDetailsResponse(eventRequestId: number) {
  const listItem = eventRequests.find((item) => item.id === eventRequestId);

  if (!listItem) {
    return jsonResponse({ message: "Event Request not found." }, 404);
  }

  const details: EventRequestDetailsApiData = {
    id: listItem.id,
    title: `Detailed ${listItem.title}`,
    event_hall_id: listItem.event_hall_id,
    type: listItem.type,
    status: listItem.status,
    start_at: listItem.start_at,
    end_at: listItem.end_at,
    duration: listItem.duration,
    description: `Detailed description for ${listItem.title}.`,
    qr_token: null,
    eventable: null,
    speakers: [],
    average_rating: null,
    qr_scans_count: 0,
    saved_count: 0,
    created_at: listItem.created_at,
    logo: null,
  };

  return jsonResponse({ status: true, message: "Success", data: details });
}

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

type EventResponder = (
  url: URL,
  requestNumber: number,
) => Response | Promise<Response>;

function installPageFetch(eventResponder?: EventResponder) {
  const requestedUrls: URL[] = [];
  let wasRejected = false;
  let eventRequestCount = 0;
  let eventDetailsRequestCount = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));
    requestedUrls.push(url);

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

    const eventDetailsMatch = url.pathname.match(
      /\/events\/requests\/(\d+)$/,
    );

    if (eventDetailsMatch) {
      eventDetailsRequestCount += 1;
      return getEventRequestDetailsResponse(Number(eventDetailsMatch[1]));
    }

    if (url.pathname.endsWith("/events/requests")) {
      eventRequestCount += 1;

      if (eventResponder) {
        return eventResponder(url, eventRequestCount);
      }

      const page = Number(url.searchParams.get("page")) || 1;
      return getEventRequestsResponse(eventRequests, page);
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  return {
    eventDetailsRequestCount: () => eventDetailsRequestCount,
    eventRequestCount: () => eventRequestCount,
    requestedUrls,
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
  document.body.style.overflow = "";
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

test("Event tab uses real rows, backend search, filters, and pagination while Booth stays intact", async () => {
  const pageFetch = installPageFetch();
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
  await view.findByRole("button", {
    name: "View details for Company #37",
  });
  await waitFor(() =>
    assert.ok(
      pageFetch.requestedUrls.filter((url) =>
        url.pathname.endsWith("/booths/requests"),
      ).length >= 1,
    ),
  );
  assert.equal(pageFetch.eventRequestCount(), 0);

  const boothSearch = view.getByRole("searchbox", {
    name: "Search by company name",
  }) as HTMLInputElement;
  fireEvent.change(boothSearch, { target: { value: "preserved search" } });
  fireEvent.click(eventTab);

  const eventPanel = view.getByRole("tabpanel", { name: "Event" });
  assert.ok(
    within(eventPanel).getByText("Loading event requests..."),
  );
  const eventTable = await within(eventPanel).findByRole("region", {
    name: "Event requests",
  });

  assert.equal(pageFetch.eventRequestCount(), 1);
  assert.ok(within(eventTable).getByText("Backend Publishing Forum"));
  assert.equal(within(eventTable).queryByText("The Future of Publishing"), null);
  assert.ok(within(eventTable).getByText("Request #301"));
  assert.ok(within(eventTable).getByText("Event Hall #31"));
  for (const label of ["Conference", "Lecture", "Workshop", "Other"]) {
    assert.ok(within(eventTable).getByText(label));
  }

  const approvedBadge = within(eventTable).getAllByLabelText(
    "Event status: Approved",
  )[0];
  const pendingBadge = within(eventTable).getByLabelText(
    "Event status: Pending",
  );
  const rejectedBadge = within(eventTable).getByLabelText(
    "Event status: Rejected",
  );
  assert.ok(approvedBadge.classList.contains("order-status--approved"));
  assert.ok(pendingBadge.classList.contains("order-status--pending"));
  assert.ok(rejectedBadge.classList.contains("order-status--rejected"));

  assert.equal(view.queryByText("NON_UI_DESCRIPTION_VALUE"), null);
  assert.equal(view.queryByText("NON_UI_QR_VALUE"), null);
  assert.equal(view.queryByText("NON_UI_LOGO_VALUE"), null);
  assert.equal(within(eventTable).queryByText("Duration"), null);
  assert.equal(within(eventTable).queryByText("Description"), null);
  assert.equal(
    within(eventTable).queryByText("2026-07-24T11:00:00.000000Z"),
    null,
  );

  fireEvent.click(
    within(eventPanel).getByRole("button", { name: "2" }),
  );
  await waitFor(() => assert.equal(pageFetch.eventRequestCount(), 2));
  let latestEventUrl = pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/events/requests"),
  ).at(-1);
  assert.equal(latestEventUrl?.searchParams.get("page"), "2");

  const eventSearch = within(eventPanel).getByRole("searchbox", {
    name: "Search event titles",
  });
  fireEvent.change(eventSearch, { target: { value: "Publishing" } });
  await waitFor(() => assert.equal(pageFetch.eventRequestCount(), 3), {
    timeout: 1200,
  });
  latestEventUrl = pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/events/requests"),
  ).at(-1);
  assert.equal(latestEventUrl?.searchParams.get("page"), "1");
  assert.equal(
    latestEventUrl?.searchParams.get("filter[title]"),
    "Publishing",
  );

  fireEvent.click(
    within(eventPanel).getByRole("button", {
      name: "Open event request filters",
    }),
  );
  const filterPanel = view.getByRole("dialog", {
    name: "Event request filters",
  });
  const selects = filterPanel.querySelectorAll("select");
  const dateInput = filterPanel.querySelector('input[type="date"]');
  assert.ok(dateInput);
  fireEvent.change(selects[0], { target: { value: "pending" } });
  fireEvent.change(dateInput, { target: { value: "2026-07-21" } });
  fireEvent.change(selects[1], { target: { value: "created_at" } });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(pageFetch.eventRequestCount(), 4));
  latestEventUrl = pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/events/requests"),
  ).at(-1);
  assert.equal(latestEventUrl?.searchParams.get("filter[status]"), "pending");
  assert.equal(
    latestEventUrl?.searchParams.get("filter[created_date]"),
    "2026-07-21",
  );
  assert.equal(latestEventUrl?.searchParams.get("sort"), "created_at");

  await waitFor(
    () =>
      assert.equal(
        pageFetch.requestedUrls.filter((url) =>
          url.pathname.endsWith("/booths/requests"),
        ).length,
        2,
      ),
    { timeout: 1200 },
  );
  const latestBoothUrl = pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/booths/requests"),
  ).at(-1);
  assert.equal(
    latestBoothUrl?.searchParams.get("filter[company.name]"),
    "preserved search",
  );
  for (const eventUrl of pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/events/requests"),
  )) {
    assert.equal(eventUrl.searchParams.has("filter[company.name]"), false);
  }

  fireEvent.click(boothTab);
  assert.equal(
    (view.getByRole("searchbox", {
      name: "Search by company name",
    }) as HTMLInputElement).value,
    "preserved search",
  );
  assert.equal(
    pageFetch.requestedUrls.filter((url) =>
      url.pathname.endsWith("/booths/requests"),
    ).length,
    2,
  );

  fireEvent.click(
    view.getByRole("button", {
      name: "View details for Company #37",
    }),
  );
  await view.findByRole("heading", { name: "Damascus Expo" });
  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  fireEvent.click(view.getByRole("button", { name: "Reject Request" }));

  assert.ok(await view.findByRole("status", { name: "Rejected" }));
  assert.equal(pageFetch.wasRejected(), true);
});

test("Event tab displays loading, empty, error, and Retry states", async () => {
  const pendingRequest = createDeferred<Response>();
  let retryMode = false;
  const pageFetch = installPageFetch((_url, requestNumber) => {
    if (requestNumber === 1) {
      return pendingRequest.promise;
    }

    if (!retryMode) {
      return jsonResponse({ message: "Event requests unavailable." }, 503);
    }

    return getEventRequestsResponse([eventRequests[0]], 1, 1, 1);
  });
  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  fireEvent.click(view.getByRole("tab", { name: "Event" }));
  assert.ok(await view.findByText("Loading event requests..."));

  await act(async () => {
    pendingRequest.resolve(getEventRequestsResponse([], 1, 0, 1));
    await pendingRequest.promise;
  });
  assert.ok(await view.findByText("No event requests found."));
  assert.equal(pageFetch.eventRequestCount(), 1);

  fireEvent.change(
    view.getByRole("searchbox", { name: "Search event titles" }),
    { target: { value: "unavailable" } },
  );
  await waitFor(() => assert.equal(pageFetch.eventRequestCount(), 2), {
    timeout: 1200,
  });
  assert.equal(
    (await view.findByRole("alert")).textContent,
    "Event requests unavailable.Try again",
  );

  retryMode = true;
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  assert.ok(await view.findByText("Backend Publishing Forum"));
  assert.equal(pageFetch.eventRequestCount(), 3);
  const retryUrl = pageFetch.requestedUrls.filter((url) =>
    url.pathname.endsWith("/events/requests"),
  ).at(-1);
  assert.equal(
    retryUrl?.searchParams.get("filter[title]"),
    "unavailable",
  );
});

test("Event requests render valid Arabic controls and localized backend values", async () => {
  window.localStorage.setItem("ems-language", "ar");
  const pageFetch = installPageFetch();
  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  fireEvent.click(view.getByRole("tab", { name: ar.order.tabs.event }));
  const eventTable = await view.findByRole("region", {
    name: ar.order.eventRequests.table.ariaLabel,
  });

  assert.equal(pageFetch.eventRequestCount(), 1);
  assert.ok(
    view.getByRole("searchbox", {
      name: ar.order.eventRequests.filters.searchAriaLabel,
    }),
  );
  assert.ok(
    view.getByRole("button", {
      name: ar.order.eventRequests.filters.filterAriaLabel,
    }),
  );
  assert.ok(within(eventTable).getByText("Backend Publishing Forum"));
  assert.ok(
    within(eventTable).getByText(
      ar.order.eventRequests.table.types.conference,
    ),
  );
  assert.ok(
    within(eventTable).getByText(ar.order.eventRequests.table.types.lecture),
  );
  assert.ok(
    within(eventTable).getByText(ar.order.eventRequests.table.types.workshop),
  );
  assert.ok(
    within(eventTable).getByText(ar.order.eventRequests.table.types.other),
  );
  assert.ok(
    within(eventTable).getAllByLabelText(
      `${ar.order.eventRequests.table.eventStatus}: ${ar.order.status.approved}`,
    ).length,
  );
  assert.ok(
    within(eventTable).getByLabelText(
      `${ar.order.eventRequests.table.eventStatus}: ${ar.order.status.pending}`,
    ),
  );
  assert.ok(
    within(eventTable).getByLabelText(
      `${ar.order.eventRequests.table.eventStatus}: ${ar.order.status.rejected}`,
    ),
  );
});

test("Event rows open the correct details with mouse and keyboard without changing Booth details", async () => {
  const pageFetch = installPageFetch();
  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  fireEvent.click(view.getByRole("tab", { name: "Event" }));
  const firstRow = await view.findByRole("button", {
    name: "Open details for Backend Publishing Forum",
  });
  fireEvent.click(firstRow);

  assert.ok(view.getByRole("dialog"));
  assert.ok(await view.findByRole("heading", {
    name: "Detailed Backend Publishing Forum",
  }));
  assert.equal(pageFetch.eventDetailsRequestCount(), 1);
  assert.equal(
    pageFetch.requestedUrls.at(-1)?.pathname,
    "/api/v1/admin/events/requests/301",
  );
  fireEvent.click(
    view.getByRole("button", { name: "Close Event Request details" }),
  );

  const secondRow = view.getByRole("button", {
    name: "Open details for Backend Author Lecture",
  });
  secondRow.focus();
  fireEvent.keyDown(secondRow, { key: "Enter" });

  assert.ok(await view.findByRole("heading", {
    name: "Detailed Backend Author Lecture",
  }));
  assert.equal(pageFetch.eventDetailsRequestCount(), 2);
  assert.equal(
    pageFetch.requestedUrls.at(-1)?.pathname,
    "/api/v1/admin/events/requests/302",
  );
  fireEvent.click(
    view.getByRole("button", { name: "Close Event Request details" }),
  );

  fireEvent.click(view.getByRole("tab", { name: "Booth" }));
  fireEvent.click(
    view.getByRole("button", {
      name: "View details for Company #37",
    }),
  );
  assert.ok(await view.findByRole("heading", { name: "Damascus Expo" }));
});
