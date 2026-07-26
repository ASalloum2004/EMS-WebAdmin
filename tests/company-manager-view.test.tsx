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
import {
  MOCK_MANAGERS,
  MOCK_MANAGER_SUMMARY,
} from "../src/features/company/data/managerMockData.js";
import { CompanyPage } from "../src/features/company/pages/CompanyPage.js";
import type { CompaniesApiResponse } from "../src/features/company/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

const companyResponse: CompaniesApiResponse = {
  status: true,
  message: "companies retrieved successfully",
  data: {
    data: [
      {
        id: 1,
        name: "Dar Al feker",
        business_sector: "Lectures & Exhibitions",
        phone: "+963112223334",
        status: "approved",
        logo: null,
        managers_count: 2,
        booths_count: 2,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 1,
    last_page: 1,
  },
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "manager-view-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.dir = "";
  document.documentElement.lang = "";
  window.localStorage.clear();
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

test("manager mock data matches the future response shape and summary", () => {
  const sampleManager = MOCK_MANAGERS.find((manager) => manager.id === 3);

  assert.deepEqual(sampleManager, {
    id: 3,
    name: "Elcoach",
    email: "zuheiralhomsi73@gmail.com",
    avatar: null,
    companies_count: 6,
    booths_count: 2,
  });
  assert.equal(MOCK_MANAGER_SUMMARY.totalManagers, MOCK_MANAGERS.length);
  assert.equal(
    MOCK_MANAGER_SUMMARY.managedCompanies,
    MOCK_MANAGERS.reduce(
      (total, manager) => total + manager.companies_count,
      0,
    ),
  );
  assert.equal(
    MOCK_MANAGER_SUMMARY.managedBooths,
    MOCK_MANAGERS.reduce(
      (total, manager) => total + manager.booths_count,
      0,
    ),
  );
});

test("switches views and supports local manager search, pagination, and modal", async () => {
  const companyRequestUrls: URL[] = [];

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

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

    companyRequestUrls.push(url);
    return jsonResponse(companyResponse);
  };

  const view = render(
    <I18nProvider>
      <CompanyPage />
    </I18nProvider>,
  );

  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  assert.equal(view.queryByText("Total Managers"), null);

  const companyTab = view.getByRole("tab", { name: "View by Company" });
  const managerTab = view.getByRole("tab", { name: "View by Manager" });
  assert.equal(companyTab.getAttribute("aria-selected"), "true");
  fireEvent.click(managerTab);

  assert.equal(managerTab.getAttribute("aria-selected"), "true");
  assert.equal(companyTab.getAttribute("aria-selected"), "false");
  assert.equal(view.queryByText("Dar Al feker"), null);
  assert.ok(view.getByRole("heading", { name: "Total Managers" }));
  assert.ok(view.getByRole("heading", { name: "Managed Companies" }));
  assert.ok(view.getByRole("heading", { name: "Managed Booths" }));

  const totalManagersCard = view
    .getByRole("heading", { name: "Total Managers" })
    .closest<HTMLElement>(".card");
  assert.ok(totalManagersCard);
  assert.ok(within(totalManagersCard).getByText("12"));
  assert.ok(view.getByText("12 matching managers"));
  assert.equal(view.queryByLabelText("Rows per page"), null);

  const elcoachRow = view.getByRole("button", {
    name: "Open manager details for Elcoach",
  });
  assert.ok(within(elcoachRow).getByText("Elcoach"));
  assert.ok(within(elcoachRow).getByText("E"));
  assert.ok(within(elcoachRow).getByText("zuheiralhomsi73@gmail.com"));
  assert.ok(within(elcoachRow).getByText("6"));
  assert.ok(within(elcoachRow).getByText("2"));
  assert.equal(view.queryByText("#3"), null);
  assert.equal(view.queryByText("Managed Portfolios"), null);

  const managerPanel = view.getByRole("tabpanel", {
    name: "Manager directory and controls",
  });
  fireEvent.click(within(managerPanel).getByRole("button", { name: "2" }));
  await waitFor(() => assert.ok(view.getByText("Rami Al-Ahmad")));
  assert.ok(view.getByText("Samer Tabbal"));

  const managerSearch = view.getByRole("searchbox", {
    name: "Search managers by name",
  });
  fireEvent.change(managerSearch, { target: { value: "elCOAch" } });
  assert.ok(view.getByText("Elcoach"));
  assert.equal(view.queryByText("Rami Al-Ahmad"), null);
  assert.equal(
    view.getByRole("button", { name: "1" }).getAttribute("aria-current"),
    "page",
  );

  fireEvent.change(managerSearch, {
    target: { value: "zuheiralhomsi73" },
  });
  assert.ok(view.getByText("No managers match your search."));
  assert.equal(view.queryByText("Elcoach"), null);
  assert.equal(view.queryByText("Rows per page"), null);

  fireEvent.change(managerSearch, { target: { value: "" } });
  assert.ok(view.getByText("Elcoach"));
  assert.ok(view.getByText("12 matching managers"));

  fireEvent.click(
    view.getByRole("button", {
      name: "Open manager details for Elcoach",
    }),
  );
  const modal = view.getByRole("dialog", { name: "Manager details" });
  assert.equal(document.body.style.overflow, "hidden");
  assert.ok(within(modal).getByText("Manager Profile"));
  assert.ok(within(modal).getByText("Management Summary"));
  assert.ok(within(modal).getByText("zuheiralhomsi73@gmail.com"));
  assert.ok(within(modal).getByText("6"));
  assert.ok(within(modal).getByText("2"));
  assert.equal(within(modal).queryByText("3"), null);
  assert.equal(within(modal).queryByText("Phone"), null);
  assert.equal(within(modal).queryByText("Managed Portfolios"), null);

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(document.body.style.overflow, "");

  fireEvent.click(companyTab);
  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  assert.equal(view.queryByText("Total Managers"), null);
  assert.equal(view.queryByRole("searchbox", { name: "Search managers by name" }), null);
  assert.ok(
    view.getByRole("searchbox", { name: "Search companies by name" }),
  );
  assert.equal(companyRequestUrls.length, 1);
});
