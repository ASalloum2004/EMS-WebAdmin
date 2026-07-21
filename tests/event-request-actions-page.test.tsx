import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { OrderPage } from "../src/features/order/pages/OrderPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function installPageFetch(mode: "approve" | "invalid-reject") {
  let actionCount = 0;
  let boothListCount = 0;
  let boothStatisticsCount = 0;
  let detailsCount = 0;
  let eventListCount = 0;
  let eventStatus = "pending";
  const actionBodies: unknown[] = [];

  globalThis.fetch = async (input, init) => {
    const url = new URL(getRequestedUrl(input));

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

    if (url.pathname.endsWith("/booths/requests/stats")) {
      boothStatisticsCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          approved_requests: 0,
          pending_requests: 0,
          total_requests: 0,
        },
      });
    }

    if (url.pathname.endsWith("/booths/requests")) {
      boothListCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          current_page: 1,
          data: [],
          last_page: 1,
          per_page: 5,
          total: 0,
        },
      });
    }

    if (url.pathname.endsWith("/events/requests/611/approve")) {
      actionCount += 1;
      assert.equal(init?.method, "POST");
      actionBodies.push(JSON.parse(String(init?.body)));
      eventStatus = "approved";
      return jsonResponse({ status: true, message: "Success", data: null });
    }

    if (url.pathname.endsWith("/events/requests/611/reject")) {
      actionCount += 1;
      assert.equal(init?.method, "PATCH");
      assert.equal(init?.body, undefined);
      eventStatus = "rejected";

      if (mode === "invalid-reject") {
        return jsonResponse(
          { status: false, message: "event.invalid_status", errors: null },
          400,
        );
      }

      return jsonResponse({ status: true, message: "Success", data: null });
    }

    if (url.pathname.endsWith("/events/requests/611")) {
      detailsCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          id: 611,
          title: "Integrated Event Request",
          event_hall_id: 8,
          type: "conference",
          status: eventStatus,
          start_at: "2026-08-12T10:00:00.000000Z",
          end_at: "2026-08-12T12:00:00.000000Z",
          duration: 2,
          description: "Integration fixture.",
          qr_token: null,
          eventable: null,
          speakers: [],
          average_rating: null,
          qr_scans_count: 0,
          saved_count: 0,
          created_at: "2026-07-21T14:05:08.000000Z",
          logo: null,
        },
      });
    }

    if (url.pathname.endsWith("/events/requests")) {
      eventListCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          current_page: 1,
          data: [
            {
              id: 611,
              title: "Integrated Event Request",
              event_hall_id: 8,
              type: "conference",
              status: eventStatus,
              start_at: "2026-08-12T10:00:00.000000Z",
              end_at: "2026-08-12T12:00:00.000000Z",
              duration: 2,
              description: "Integration fixture.",
              qr_token: null,
              created_at: "2026-07-21T14:05:08.000000Z",
              logo: null,
            },
          ],
          last_page: 1,
          per_page: 15,
          total: 1,
        },
      });
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  return {
    actionBodies,
    actionCount: () => actionCount,
    boothListCount: () => boothListCount,
    boothStatisticsCount: () => boothStatisticsCount,
    detailsCount: () => detailsCount,
    eventListCount: () => eventListCount,
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
          ? JSON.stringify({ token: "event-page-test-token" })
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

async function openPendingEventRequest() {
  const view = render(
    <I18nProvider>
      <OrderPage />
    </I18nProvider>,
  );

  fireEvent.click(view.getByRole("tab", { name: "Event" }));
  fireEvent.click(
    await view.findByRole("button", {
      name: "Open details for Integrated Event Request",
    }),
  );
  await view.findByRole("heading", { name: "Integrated Event Request" });

  return view;
}

test("OrderPage confirms normal Event approval then refreshes Event details and list only", async () => {
  const requests = installPageFetch("approve");
  const view = await openPendingEventRequest();

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  assert.equal(requests.actionCount(), 0);
  assert.ok(
    view.getByRole("alertdialog", { name: "Approve Event Request?" }),
  );

  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));

  assert.ok(await view.findByRole("status", { name: "Approved" }));
  assert.equal(requests.actionCount(), 1);
  assert.deepEqual(requests.actionBodies, [{ force: false }]);
  assert.equal(requests.detailsCount(), 2);
  assert.equal(requests.eventListCount(), 2);
  assert.equal(requests.boothListCount(), 1);
  assert.equal(requests.boothStatisticsCount(), 1);
});

test("OrderPage refreshes and translates invalid Event status, then clears it on details close", async () => {
  const requests = installPageFetch("invalid-reject");
  const view = await openPendingEventRequest();

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.equal(requests.actionCount(), 0);
  fireEvent.click(view.getByRole("button", { name: "Reject Request" }));

  assert.ok(await view.findByRole("status", { name: "Rejected" }));
  assert.ok(
    await view.findByText(
      "This Event Request is no longer pending. The latest status has been refreshed.",
    ),
  );
  assert.equal(requests.actionCount(), 1);
  assert.equal(requests.detailsCount(), 2);
  assert.equal(requests.eventListCount(), 2);
  assert.equal(requests.boothListCount(), 1);
  assert.equal(requests.boothStatisticsCount(), 1);

  fireEvent.click(
    view.getByRole("button", { name: "Close Event Request details" }),
  );
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  fireEvent.click(
    view.getByRole("button", {
      name: "Open details for Integrated Event Request",
    }),
  );
  await view.findByRole("status", { name: "Rejected" });
  assert.equal(
    view.queryByText(
      "This Event Request is no longer pending. The latest status has been refreshed.",
    ),
    null,
  );
});
