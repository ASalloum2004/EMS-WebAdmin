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
  buildCompaniesPath,
  buildCompanyDetailsPath,
  getCompanies,
  normalizeCompaniesResponse,
  normalizeCompanyDetailsResponse,
} from "../src/features/company/api/index.js";
import { getCompanyStatusVariant } from "../src/features/company/components/CompanyStatusBadge/CompanyStatusBadge.js";
import { CompanyPage } from "../src/features/company/pages/CompanyPage.js";
import type {
  CompaniesApiResponse,
  CompanyDetailsApiResponse,
} from "../src/features/company/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

const companyListItems: CompaniesApiResponse["data"]["data"] = [
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
  {
    id: 5,
    name: "Metro Tech Labs",
    business_sector: "Technology",
    phone: "+963117778889",
    status: "pending",
    logo: null,
    managers_count: 2,
    booths_count: 0,
  },
];

const detailResponse: CompanyDetailsApiResponse = {
  status: true,
  message: "company retrieved successfully",
  data: {
    id: 1,
    name: "Dar Al feker",
    business_sector: "Lectures & Exhibitions",
    phone: "+963112223334",
    status: "approved",
    logo: null,
    managers: [
      {
        id: 12,
        name: "Directory Manager",
        email: "manager@example.com",
        avatar: null,
        phone: null,
      },
    ],
    booths: [
      {
        id: 43,
        number: "2C-01",
        hall: "2",
        label: "Booth 2-2C-01",
      },
    ],
  },
};

function createListResponse(
  items = companyListItems,
  currentPage = 1,
): CompaniesApiResponse {
  return {
    status: true,
    message: "companies retrieved successfully",
    data: {
      data: items,
      current_page: currentPage,
      per_page: 15,
      total: currentPage === 1 ? 16 : 2,
      last_page: 2,
    },
  };
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}

function profileResponse() {
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

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "company-page-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
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

test("builds exact company list and detail paths without empty or status filters", () => {
  assert.equal(
    buildCompaniesPath({
      businessSector: " Technology ",
      name: " Tech ",
      page: 2,
      perPage: 15,
    }),
    "companies?filter%5Bname%5D=Tech&filter%5Bbusiness_sector%5D=Technology&page=2&per_page=15",
  );
  assert.equal(
    buildCompaniesPath({ businessSector: " ", name: " " }),
    "companies?page=1&per_page=15",
  );
  assert.equal(buildCompanyDetailsPath(5), "companies/5");
  assert.throws(() => buildCompanyDetailsPath(0), /valid company ID/);
  assert.doesNotMatch(buildCompaniesPath(), /status|active/i);
});

test("normalizes verified list and detail wrappers without exposing IDs or counts", () => {
  const listResult = normalizeCompaniesResponse(createListResponse());
  const company = listResult.companies[0];

  assert.deepEqual(company, {
    id: 1,
    name: "Dar Al feker",
    businessSector: "Lectures & Exhibitions",
    phone: "+963112223334",
    status: "approved",
    logo: null,
  });
  assert.equal(Object.hasOwn(company, "managers_count"), false);
  assert.equal(Object.hasOwn(company, "booths_count"), false);
  assert.deepEqual(listResult.pagination, {
    currentPage: 1,
    perPage: 15,
    totalItems: 16,
    totalPages: 2,
  });

  const details = normalizeCompanyDetailsResponse(detailResponse);
  assert.deepEqual(details.managers, [
    {
      name: "Directory Manager",
      email: "manager@example.com",
      avatar: null,
      phone: null,
    },
  ]);
  assert.deepEqual(details.booths, [
    { number: "2C-01", hall: "2", label: "Booth 2-2C-01" },
  ]);
  assert.deepEqual(details.gallery, []);
  assert.equal(details.description, null);
  assert.equal(Object.hasOwn(details.managers[0], "id"), false);
  assert.equal(Object.hasOwn(details.booths[0], "id"), false);
  assert.equal(details.status, "approved");
  assert.equal(getCompanyStatusVariant("approved"), "approved");
  assert.equal(getCompanyStatusVariant("PENDING"), "not-approved");
  assert.equal(getCompanyStatusVariant("rejected"), "not-approved");
  assert.equal(getCompanyStatusVariant(null), "missing");
});

test("uses the authenticated shared API client for the companies list", async () => {
  let requestUrl = "";
  let authorization = "";

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";

    return jsonResponse(createListResponse());
  };

  const result = await getCompanies({ name: "Tech", page: 1 });
  const url = new URL(requestUrl);

  assert.equal(url.pathname, "/api/v1/admin/companies");
  assert.equal(url.searchParams.get("filter[name]"), "Tech");
  assert.equal(url.searchParams.get("filter[status]"), null);
  assert.equal(authorization, "Bearer company-page-test-token");
  assert.equal(result.companies.length, 2);
});

test("View by Company uses server controls and opens lazy cached details in a modal", async () => {
  const requestedUrls: URL[] = [];
  let detailRequestCount = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.pathname.endsWith("/profile")) {
      return profileResponse();
    }

    requestedUrls.push(url);

    if (url.pathname.endsWith("/companies/1")) {
      detailRequestCount += 1;
      return jsonResponse(detailResponse);
    }

    const name = url.searchParams.get("filter[name]");
    const businessSector = url.searchParams.get(
      "filter[business_sector]",
    );
    const page = Number(url.searchParams.get("page") ?? "1");
    const filteredItems = companyListItems.filter(
      (company) =>
        (!name || company.name?.includes(name)) &&
        (!businessSector || company.business_sector === businessSector),
    );

    return jsonResponse(createListResponse(filteredItems, page));
  };

  const view = render(
    <I18nProvider>
      <CompanyPage />
    </I18nProvider>,
  );

  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  assert.ok(
    view.getByRole("heading", { name: "Companies & Managers Directory" }),
  );
  assert.ok(view.getAllByText("Status").length >= 1);
  assert.ok(view.getByText("Approved"));
  assert.equal(view.queryByText("Year Founded"), null);
  assert.equal(view.queryByText("Total Managers"), null);

  const search = view.getByRole("searchbox", {
    name: "Search companies by name",
  });
  fireEvent.change(search, { target: { value: "Tech" } });

  await waitFor(
    () =>
      assert.ok(
        requestedUrls.some(
          (url) =>
            url.searchParams.get("filter[name]") === "Tech" &&
            url.searchParams.get("page") === "1",
        ),
      ),
    { timeout: 1200 },
  );
  await waitFor(() => assert.ok(view.getByText("Metro Tech Labs")));

  fireEvent.click(view.getByRole("button", { name: "Open company filters" }));
  const filterPanel = view.getByRole("group", { name: "Company filters" });
  assert.equal(within(filterPanel).queryByLabelText("Status"), null);
  fireEvent.change(within(filterPanel).getByLabelText("Business Sector"), {
    target: { value: "Technology" },
  });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("filter[name]") === "Tech" &&
          url.searchParams.get("filter[business_sector]") === "Technology" &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("filter[status]") === null,
      ),
    ),
  );

  fireEvent.change(search, { target: { value: "" } });
  await waitFor(
    () =>
      assert.ok(
        requestedUrls.some(
          (url) =>
            url.searchParams.get("filter[name]") === null &&
            url.searchParams.get("filter[business_sector]") ===
              "Technology",
        ),
      ),
    { timeout: 1200 },
  );

  fireEvent.click(view.getByRole("button", { name: "Open company filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear" }));
  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("filter[name]") === null &&
          url.searchParams.get("filter[business_sector]") === null,
      ),
    ),
  );

  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  fireEvent.click(
    view.getByRole("button", {
      name: "Open company details for Dar Al feker",
    }),
  );
  assert.ok(view.getByRole("dialog", { name: "Company details" }));
  assert.equal(view.container.querySelector(".data-table__expanded"), null);
  await waitFor(() => assert.equal(detailRequestCount, 1));
  await waitFor(() => assert.ok(view.getByText("Directory Manager")));
  assert.ok(view.getByText("Booth 2-2C-01"));
  assert.ok(view.getAllByText("Approved").length >= 2);
  assert.equal(view.queryByText("Year Founded"), null);

  fireEvent.click(
    view.getByRole("button", { name: "Close company details" }),
  );
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  fireEvent.click(
    view.getByRole("button", {
      name: "Open company details for Dar Al feker",
    }),
  );
  await waitFor(() => assert.ok(view.getByText("Directory Manager")));
  assert.equal(detailRequestCount, 1);

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));

  const footer = view.container.querySelector<HTMLElement>(
    ".company-page__footer",
  );
  assert.ok(footer);
  fireEvent.click(within(footer).getByRole("button", { name: "2" }));
  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("page") === "2" &&
          url.searchParams.get("filter[name]") === null &&
          url.searchParams.get("filter[business_sector]") === null,
      ),
    ),
  );
});
