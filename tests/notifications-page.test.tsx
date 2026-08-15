import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { NotificationsPage } from "../src/features/notifications/pages/NotificationsPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

const unreadNotification = {
  body: "A new report was submitted and requires your attention.",
  created_at: "2026-08-15T09:17:15.000000Z",
  id: "367cee0e-c010-48c8-99a2-d4b0e8ffb3b8",
  read_at: null,
  target_id: "1",
  title: "New Report Received",
  type: "report_created",
};

function installAuthSession() {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session" ? JSON.stringify({ token: "test-token" }) : null,
    } as Storage,
  });
}

function createListResponse(readAt: string | null) {
  return {
    data: {
      current_page: 1,
      data: [{ ...unreadNotification, read_at: readAt }],
      last_page: 1,
      per_page: 15,
      total: 1,
    },
    message: "Success",
    status: true,
  };
}

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
  installAuthSession();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  document.documentElement.dir = "";
  document.documentElement.lang = "";
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

test("uses server endpoints for tabs and refreshes both lists and statistics after mark all", async () => {
  const requests: Array<{ method: string; pathname: string }> = [];
  let hasMarkedAllAsRead = false;

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const method = init?.method ?? "GET";
    requests.push({ method, pathname: url.pathname });

    if (url.pathname.endsWith("/read-all")) {
      hasMarkedAllAsRead = true;

      return new Response(
        JSON.stringify({ data: null, message: "Success", status: true }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (url.pathname.endsWith("/statistics")) {
      return new Response(
        JSON.stringify({
          data: {
            read_notifications: hasMarkedAllAsRead ? 1 : 0,
            total_notifications: 1,
            unread_notifications: hasMarkedAllAsRead ? 0 : 1,
          },
          message: "Success",
          status: true,
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (url.pathname.endsWith("/unread")) {
      return new Response(
        JSON.stringify(
          hasMarkedAllAsRead
            ? {
                data: {
                  current_page: 1,
                  data: [],
                  last_page: 1,
                  per_page: 15,
                  total: 0,
                },
                message: "Success",
                status: true,
              }
            : createListResponse(null),
        ),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    }

    return new Response(
      JSON.stringify(
        createListResponse(
          hasMarkedAllAsRead ? "2026-08-15T09:30:04.000000Z" : null,
        ),
      ),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  };

  const view = render(
    <I18nProvider>
      <NotificationsPage />
    </I18nProvider>,
  );
  const allTab = view.getByRole("tab", { name: "All Notifications" });
  const unreadTab = view.getByRole("tab", {
    name: "Unread Notifications",
  });
  const totalCard = (await view.findByRole("heading", {
    name: "Total Notifications",
  }))
    .closest<HTMLElement>(".card");
  const unreadCard = (await view.findByRole("heading", {
    name: "Unread Notifications",
  }))
    .closest<HTMLElement>(".card");
  const readCard = (await view.findByRole("heading", {
    name: "Read Notifications",
  }))
    .closest<HTMLElement>(".card");

  assert.ok(totalCard);
  assert.ok(unreadCard);
  assert.ok(readCard);

  await waitFor(() => {
    assert.ok(view.getByText("New Report Received"));
    assert.ok(view.getByText("report created"));
    assert.ok(within(totalCard).getByText("1"));
    assert.ok(within(unreadCard).getByText("1"));
    assert.ok(within(readCard).getByText("0"));
  });
  assert.equal(
    view.queryByText(
      "A new report was submitted and requires your attention.",
    ),
    null,
  );

  assert.equal(allTab.getAttribute("aria-selected"), "true");
  assert.ok(
    requests.some(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/v1/admin/notifications",
    ),
  );

  fireEvent.click(unreadTab);

  await waitFor(() => {
    assert.equal(unreadTab.getAttribute("aria-selected"), "true");
    assert.ok(view.getByText("New Report Received"));
  });
  assert.ok(
    requests.some(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/v1/admin/notifications/unread",
    ),
  );

  fireEvent.click(
    view.getByRole("button", { name: "Mark all as read" }),
  );

  await waitFor(() => {
    assert.ok(within(unreadCard).getByText("0"));
    assert.ok(within(readCard).getByText("1"));
  });

  assert.ok(
    requests.some(
      (request) =>
        request.method === "PATCH" &&
        request.pathname === "/api/v1/admin/notifications/read-all",
    ),
  );
  assert.ok(
    requests.filter(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/v1/admin/notifications",
    ).length >= 2,
  );
  assert.ok(
    requests.filter(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/v1/admin/notifications/unread",
    ).length >= 2,
  );
  assert.ok(
    requests.filter(
      (request) =>
        request.method === "GET" &&
        request.pathname === "/api/v1/admin/notifications/statistics",
    ).length >= 2,
  );
  assert.ok(view.getByText("No notifications are available."));
});
