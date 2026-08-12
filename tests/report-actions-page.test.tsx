import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ReportsPage } from "../src/features/reports/pages/ReportsPage.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import type { ReportStatus } from "../src/features/reports/types.js";

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

function installPageFetch(action: "resolve" | "reject") {
  let adminNotes: string | null = null;
  let detailsCount = 0;
  let listCount = 0;
  let statisticsCount = 0;
  let status: ReportStatus = "pending";
  const actionRequests: Array<{
    body: unknown;
    method: string | undefined;
    path: string;
  }> = [];
  const listUrls: string[] = [];

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

    if (url.pathname.endsWith("/reports/statistics")) {
      statisticsCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          total_requests: 1,
          pending_requests: status === "pending" ? 1 : 0,
          resolved_requests: status === "resolved" ? 1 : 0,
          rejected_requests: status === "rejected" ? 1 : 0,
        },
      });
    }

    if (
      url.pathname.endsWith("/reports/41/resolved") ||
      url.pathname.endsWith("/reports/41/rejected")
    ) {
      const body = JSON.parse(String(init?.body)) as { notes: string | null };
      actionRequests.push({
        body,
        method: init?.method,
        path: url.pathname,
      });
      adminNotes = body.notes;
      status = action === "resolve" ? "resolved" : "rejected";
      return jsonResponse({});
    }

    if (url.pathname.endsWith("/reports/41")) {
      detailsCount += 1;
      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          admin_notes: adminNotes,
          created_at: "2026-08-12T10:52:59.000000Z",
          description: "Integrated Report description.",
          id: 41,
          status,
          title: "Integrated Report",
        },
      });
    }

    if (url.pathname.endsWith("/reports")) {
      listCount += 1;
      listUrls.push(url.toString());
      const pendingFilter = url.searchParams.get("filter[status]") === "pending";
      const items = pendingFilter && status !== "pending"
        ? []
        : [
            {
              admin_notes: adminNotes,
              created_at: "2026-08-12T10:52:59.000000Z",
              description: "Integrated Report description.",
              id: 41,
              status,
              title: "Integrated Report",
            },
          ];

      return jsonResponse({
        status: true,
        message: "Success",
        data: {
          current_page: 1,
          data: items,
          last_page: 1,
          per_page: 4,
          total: items.length,
        },
      });
    }

    throw new Error(`Unexpected request: ${url.pathname}`);
  };

  return {
    actionRequests,
    detailsCount: () => detailsCount,
    listCount: () => listCount,
    listUrls,
    statisticsCount: () => statisticsCount,
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
          ? JSON.stringify({ token: "report-actions-page-token" })
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

function renderReportsPage() {
  return render(
    <I18nProvider>
      <ReportsPage />
    </I18nProvider>,
  );
}

async function openReportDetails(
  view: ReturnType<typeof renderReportsPage>,
) {
  fireEvent.click(
    await view.findByRole("button", {
      name: "Open details for report: Integrated Report",
    }),
  );
  await view.findByText("Integrated Report description.");
}

test("Approve calls Resolve, refreshes all Report data, and preserves list criteria", async () => {
  const requests = installPageFetch("resolve");
  const view = renderReportsPage();

  const search = await view.findByRole("searchbox", {
    name: "Search reports by event title or booth number",
  });
  fireEvent.change(search, { target: { value: "Integrated" } });
  await waitFor(
    () =>
      assert.equal(
        new URL(
          requests.listUrls[requests.listUrls.length - 1]!,
        ).searchParams.get("filter[search]"),
        "Integrated",
      ),
    { timeout: 1200 },
  );

  fireEvent.click(
    view.getByRole("button", { name: "Open report filters" }),
  );
  fireEvent.change(view.getByRole("combobox"), {
    target: { value: "pending" },
  });
  fireEvent.change(view.getByLabelText("Created Date"), {
    target: { value: "2026-08-12" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => {
    const latestUrl = new URL(
      requests.listUrls[requests.listUrls.length - 1]!,
    );
    assert.equal(latestUrl.searchParams.get("filter[status]"), "pending");
    assert.equal(
      latestUrl.searchParams.get("filter[created_date]"),
      "2026-08-12",
    );
  });

  await openReportDetails(view);
  const listCountBeforeAction = requests.listCount();
  const detailsCountBeforeAction = requests.detailsCount();
  const statisticsCountBeforeAction = requests.statisticsCount();

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  assert.equal(requests.actionRequests.length, 0);
  fireEvent.change(view.getByLabelText("Admin Notes (optional)"), {
    target: { value: "Resolved through the Admin UI." },
  });
  fireEvent.click(view.getByRole("button", { name: "Approve Report" }));

  await view.findByText("Resolved through the Admin UI.");
  assert.ok(view.getByText("Final Status"));
  assert.equal(view.queryByRole("button", { name: "Approve" }), null);
  assert.equal(view.queryByRole("button", { name: "Reject" }), null);
  assert.deepEqual(requests.actionRequests, [
    {
      body: { notes: "Resolved through the Admin UI." },
      method: "POST",
      path: "/api/v1/admin/reports/41/resolved",
    },
  ]);
  assert.equal(requests.detailsCount(), detailsCountBeforeAction + 1);
  assert.equal(requests.listCount(), listCountBeforeAction + 1);
  assert.equal(
    requests.statisticsCount(),
    statisticsCountBeforeAction + 1,
  );

  const refreshedListUrl = new URL(
    requests.listUrls[requests.listUrls.length - 1]!,
  );
  assert.equal(
    refreshedListUrl.searchParams.get("filter[search]"),
    "Integrated",
  );
  assert.equal(
    refreshedListUrl.searchParams.get("filter[status]"),
    "pending",
  );
  assert.equal(
    refreshedListUrl.searchParams.get("filter[created_date]"),
    "2026-08-12",
  );
  assert.equal(refreshedListUrl.searchParams.get("page"), "1");
  assert.equal(view.queryByText("Integrated Report", { selector: ".report-table__title" }), null);
});

test("Reject posts notes, refreshes details/list/statistics, and shows Rejected", async () => {
  const requests = installPageFetch("reject");
  const view = renderReportsPage();
  await openReportDetails(view);
  const listCountBeforeAction = requests.listCount();
  const detailsCountBeforeAction = requests.detailsCount();
  const statisticsCountBeforeAction = requests.statisticsCount();

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.equal(requests.actionRequests.length, 0);
  fireEvent.change(view.getByLabelText("Admin Notes (optional)"), {
    target: { value: "Rejected through the Admin UI." },
  });
  fireEvent.click(view.getByRole("button", { name: "Reject Report" }));

  await view.findByText("Rejected through the Admin UI.");
  assert.ok(view.getByText("Final Status"));
  assert.ok(view.getAllByText("Rejected").length >= 1);
  assert.equal(view.queryByRole("button", { name: "Approve" }), null);
  assert.equal(view.queryByRole("button", { name: "Reject" }), null);
  assert.deepEqual(requests.actionRequests, [
    {
      body: { notes: "Rejected through the Admin UI." },
      method: "POST",
      path: "/api/v1/admin/reports/41/rejected",
    },
  ]);
  assert.equal(requests.detailsCount(), detailsCountBeforeAction + 1);
  assert.equal(requests.listCount(), listCountBeforeAction + 1);
  assert.equal(
    requests.statisticsCount(),
    statisticsCountBeforeAction + 1,
  );
});
