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
import { formatCompanyCount } from "../src/features/company/components/CompanyTable/CompanyTable.js";
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
    logo: "/storage/companies/dar-list.png",
    managers_count: 2,
    booths_count: 2,
  },
  {
    id: 5,
    name: "Metro Tech Labs",
    business_sector: "Technology",
    phone: "+963117778889",
    status: "pending",
    logo: "javascript:alert(1)",
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
    logo: "storage/companies/dar-details.png",
    managers: [
      {
        id: 12,
        name: "Directory Manager",
        email: "manager@example.com",
        avatar: "/storage/managers/directory-manager.png",
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
  perPage = 15,
): CompaniesApiResponse {
  const total = 16;

  return {
    status: true,
    message: "companies retrieved successfully",
    data: {
      data: items,
      current_page: currentPage,
      per_page: perPage,
      total,
      last_page: Math.max(1, Math.ceil(total / perPage)),
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

test("builds exact combined company parameters and omits empty filters", () => {
  assert.equal(
    buildCompaniesPath({
      businessSector: " Technology ",
      name: " Tech ",
      page: 2,
      perPage: 15,
      status: "approved",
    }),
    "companies?filter%5Bname%5D=Tech&filter%5Bbusiness_sector%5D=Technology&filter%5Bstatus%5D=approved&page=2&per_page=15",
  );
  assert.equal(
    buildCompaniesPath({ businessSector: " ", name: " " }),
    "companies?page=1",
  );
  assert.equal(buildCompanyDetailsPath(5), "companies/5");
  assert.throws(() => buildCompanyDetailsPath(0), /valid company ID/);
  assert.doesNotMatch(buildCompaniesPath(), /filter%5Bstatus%5D|active/i);
});

test("normalizes verified list counts while keeping relationship IDs internal", () => {
  const listResult = normalizeCompaniesResponse(createListResponse());
  const company = listResult.companies[0];

  assert.deepEqual(company, {
    id: 1,
    name: "Dar Al feker",
    businessSector: "Lectures & Exhibitions",
    phone: "+963112223334",
    managersCount: 2,
    boothsCount: 2,
    status: "approved",
    logo:
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-list.png",
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
      avatar:
        "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/directory-manager.png",
    },
  ]);
  assert.deepEqual(details.booths, [
    { number: "2C-01", hall: "2", label: "Booth 2-2C-01" },
  ]);
  assert.equal(Object.hasOwn(details.managers[0], "id"), false);
  assert.equal(Object.hasOwn(details.booths[0], "id"), false);
  assert.equal(details.status, "approved");
  assert.equal(
    details.logo,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-details.png",
  );
  assert.equal(getCompanyStatusVariant("approved"), "approved");
  assert.equal(getCompanyStatusVariant("PENDING"), "not-approved");
  assert.equal(getCompanyStatusVariant("rejected"), "not-approved");
  assert.equal(getCompanyStatusVariant(null), "missing");
  assert.equal(formatCompanyCount(0, "en"), "0");
  assert.equal(formatCompanyCount(null, "en"), "—");
});

test("uses the authenticated shared API client for the companies list", async () => {
  let requestUrl = "";
  let authorization = "";

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    authorization = new Headers(init?.headers).get("Authorization") ?? "";

    return jsonResponse(createListResponse());
  };

  const result = await getCompanies({
    businessSector: "Technology",
    name: "Tech",
    page: 1,
    status: "pending",
  });
  const url = new URL(requestUrl);

  assert.equal(url.pathname, "/api/v1/admin/companies");
  assert.equal(url.searchParams.get("filter[name]"), "Tech");
  assert.equal(
    url.searchParams.get("filter[business_sector]"),
    "Technology",
  );
  assert.equal(url.searchParams.get("filter[status]"), "pending");
  assert.equal(url.searchParams.get("per_page"), null);
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
    const status = url.searchParams.get("filter[status]");
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = 15;
    const filteredItems = companyListItems.filter(
      (company) =>
        (!name || company.name?.includes(name)) &&
        (!businessSector || company.business_sector === businessSector) &&
        (!status || company.status === status),
    );

    return jsonResponse(createListResponse(filteredItems, page, perPage));
  };

  const view = render(
    <I18nProvider>
      <CompanyPage />
    </I18nProvider>,
  );

  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  assert.equal(view.queryByLabelText("Rows per page"), null);
  assert.ok(
    view.getByRole("heading", { name: "Companies & Managers Directory" }),
  );
  assert.ok(view.getAllByText("Status").length >= 1);
  assert.ok(view.getByText("Approved"));
  assert.equal(view.queryByText("Year Founded"), null);
  assert.equal(view.queryByText("Total Managers"), null);
  const firstCompanyRow = view.getByRole("button", {
    name: "Open company details for Dar Al feker",
  });
  const companyLogo = firstCompanyRow.querySelector("img");
  assert.ok(companyLogo);
  assert.equal(
    companyLogo.src,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-list.png",
  );
  fireEvent.error(companyLogo);
  assert.ok(within(firstCompanyRow).getByText("DA"));
  assert.equal(within(firstCompanyRow).getByText("Managers").textContent, "Managers");
  assert.equal(within(firstCompanyRow).getByText("Booths").textContent, "Booths");
  assert.equal(within(firstCompanyRow).getAllByText("2").length, 2);

  const zeroCountRow = view.getByRole("button", {
    name: "Open company details for Metro Tech Labs",
  });
  assert.ok(within(zeroCountRow).getByText("0"));

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
  fireEvent.change(within(filterPanel).getByLabelText("Business Sector"), {
    target: { value: "Technology" },
  });
  fireEvent.change(within(filterPanel).getByLabelText("Status"), {
    target: { value: "pending" },
  });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("filter[name]") === "Tech" &&
          url.searchParams.get("filter[business_sector]") === "Technology" &&
          url.searchParams.get("filter[status]") === "pending" &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("per_page") === "15",
      ),
    ),
  );
  assert.equal(
    view
      .getByRole("button", { name: "Open company filters" })
      .getAttribute("aria-pressed"),
    "true",
  );

  const filteredFooter = view.container.querySelector<HTMLElement>(
    ".company-page__footer",
  );
  assert.ok(filteredFooter);
  fireEvent.click(
    within(filteredFooter).getByRole("button", { name: "2" }),
  );
  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("filter[name]") === "Tech" &&
          url.searchParams.get("filter[business_sector]") === "Technology" &&
          url.searchParams.get("filter[status]") === "pending" &&
          url.searchParams.get("page") === "2" &&
          url.searchParams.get("per_page") === "15",
      ),
    ),
  );
  await waitFor(() => assert.equal(view.queryByLabelText("Rows per page"), null));

  fireEvent.click(view.getByRole("button", { name: "Open company filters" }));
  fireEvent.click(view.getByRole("button", { name: "Clear" }));
  await waitFor(() =>
    assert.ok(
      requestedUrls.some(
        (url) =>
          url.searchParams.get("filter[name]") === "Tech" &&
          url.searchParams.get("filter[business_sector]") === null &&
          url.searchParams.get("filter[status]") === null &&
          url.searchParams.get("page") === "1" &&
          url.searchParams.get("per_page") === "15",
      ),
    ),
  );
  assert.equal(
    view
      .getByRole("button", { name: "Open company filters" })
      .getAttribute("aria-pressed"),
    "false",
  );

  fireEvent.change(search, { target: { value: "" } });
  await waitFor(
    () =>
      assert.ok(
        requestedUrls.some(
          (url) =>
            url.searchParams.get("filter[name]") === null &&
            url.searchParams.get("filter[business_sector]") === null &&
            url.searchParams.get("filter[status]") === null &&
            url.searchParams.get("page") === "1" &&
            url.searchParams.get("per_page") === "15",
        ),
      ),
    { timeout: 1200 },
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
  const companyDetailsDialog = view.getByRole("dialog", {
    name: "Company details",
  });
  const detailImages = companyDetailsDialog.querySelectorAll("img");
  assert.equal(detailImages.length, 2);
  assert.deepEqual(
    Array.from(detailImages, (image) => image.src).sort(),
    [
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-details.png",
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/directory-manager.png",
    ].sort(),
  );
  assert.ok(view.getByText("Booth 2-2C-01"));
  assert.ok(view.getAllByText("Approved").length >= 2);
  assert.equal(view.queryByText("Year Founded"), null);
  assert.equal(view.queryByText("Description"), null);
  assert.equal(view.queryByText("Website"), null);
  assert.equal(view.queryByText("LinkedIn"), null);
  assert.equal(view.queryByText("Headquarters"), null);
  assert.equal(view.queryByText("Latitude"), null);
  assert.equal(view.queryByText("Longitude"), null);
  assert.equal(view.queryByText("Gallery"), null);
  assert.equal(view.queryByText("No gallery images"), null);

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

});

test("View by Company refetches once per activation with its current query and ignores stale responses", async () => {
  const companyRequests: URL[] = [];
  const pendingCompanyRequests: Array<{
    resolve: (response: Response) => void;
    url: URL;
  }> = [];
  let deferCompanyRequests = true;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.pathname.endsWith("/profile")) {
      return profileResponse();
    }

    if (url.pathname.endsWith("/managers/directory")) {
      return jsonResponse({
        status: true,
        message: "statistics retrieved successfully",
        data: {
          total_companies: 0,
          total_booths: 0,
          total_managers: 0,
        },
      });
    }

    if (url.pathname.endsWith("/managers")) {
      return jsonResponse({
        status: true,
        message: "managers retrieved successfully",
        data: {
          data: [],
          current_page: 1,
          per_page: 15,
          total: 0,
          last_page: 1,
        },
      });
    }

    if (url.pathname.endsWith("/companies")) {
      companyRequests.push(url);

      if (deferCompanyRequests) {
        return new Promise<Response>((resolve) => {
          pendingCompanyRequests.push({ resolve, url });
        });
      }

      return jsonResponse(
        createListResponse(
          companyListItems,
          Number(url.searchParams.get("page") ?? "1"),
          15,
        ),
      );
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const view = render(
    <I18nProvider>
      <CompanyPage />
    </I18nProvider>,
  );

  assert.ok(view.container.querySelector(".company-list-skeleton"));
  await waitFor(() => assert.equal(companyRequests.length, 1));
  assert.equal(pendingCompanyRequests.length, 1);
  assert.equal(companyRequests[0].searchParams.get("page"), "1");
  assert.equal(companyRequests[0].searchParams.get("per_page"), "15");

  pendingCompanyRequests.shift()?.resolve(
    jsonResponse(createListResponse()),
  );
  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));

  const search = view.getByRole("searchbox", {
    name: "Search companies by name",
  });
  fireEvent.change(search, { target: { value: "Tech" } });
  await waitFor(
    () =>
      assert.equal(
        companyRequests.at(-1)?.searchParams.get("filter[name]"),
        "Tech",
    ),
    { timeout: 1200 },
  );
  assert.ok(view.container.querySelector(".company-list-skeleton"));
  assert.equal(view.queryByText("Dar Al feker"), null);
  assert.equal(view.container.querySelector(".company-page__footer"), null);

  pendingCompanyRequests.shift()?.resolve(
    jsonResponse(createListResponse()),
  );
  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  deferCompanyRequests = false;

  fireEvent.click(view.getByRole("button", { name: "Open company filters" }));
  const filterPanel = view.getByRole("group", { name: "Company filters" });
  fireEvent.change(within(filterPanel).getByLabelText("Business Sector"), {
    target: { value: "Technology" },
  });
  fireEvent.change(within(filterPanel).getByLabelText("Status"), {
    target: { value: "pending" },
  });
  fireEvent.click(within(filterPanel).getByRole("button", { name: "Apply" }));
  await waitFor(() => {
    const latestRequest = companyRequests.at(-1);
    assert.equal(
      latestRequest?.searchParams.get("filter[business_sector]"),
      "Technology",
    );
    assert.equal(latestRequest?.searchParams.get("filter[status]"), "pending");
  });

  const footer = view.container.querySelector<HTMLElement>(
    ".company-page__footer",
  );
  assert.ok(footer);
  fireEvent.click(within(footer).getByRole("button", { name: "2" }));
  await waitFor(() =>
    assert.equal(companyRequests.at(-1)?.searchParams.get("page"), "2"),
  );

  fireEvent.click(view.getByRole("tab", { name: "View by Manager" }));
  await waitFor(() =>
    assert.ok(
      view.getByRole("tabpanel", {
        name: "Manager directory and controls",
      }),
    ),
  );

  deferCompanyRequests = true;
  const requestsBeforeReactivation = companyRequests.length;
  fireEvent.click(view.getByRole("tab", { name: "View by Company" }));
  assert.ok(view.container.querySelector(".company-list-skeleton"));
  assert.equal(view.container.querySelector(".company-page__footer"), null);
  await waitFor(() =>
    assert.equal(companyRequests.length, requestsBeforeReactivation + 1),
  );
  const firstReactivation = pendingCompanyRequests.at(-1);
  assert.ok(firstReactivation);
  assert.equal(firstReactivation.url.searchParams.get("filter[name]"), "Tech");
  assert.equal(
    firstReactivation.url.searchParams.get("filter[business_sector]"),
    "Technology",
  );
  assert.equal(
    firstReactivation.url.searchParams.get("filter[status]"),
    "pending",
  );
  assert.equal(firstReactivation.url.searchParams.get("page"), "2");
  assert.equal(firstReactivation.url.searchParams.get("per_page"), "15");

  fireEvent.click(view.getByRole("tab", { name: "View by Manager" }));
  fireEvent.click(view.getByRole("tab", { name: "View by Company" }));
  assert.ok(view.container.querySelector(".company-list-skeleton"));
  await waitFor(() =>
    assert.equal(companyRequests.length, requestsBeforeReactivation + 2),
  );
  const secondReactivation = pendingCompanyRequests.at(-1);
  assert.ok(secondReactivation);

  secondReactivation.resolve(
    jsonResponse(createListResponse([companyListItems[1]], 2, 15)),
  );
  await waitFor(() => assert.ok(view.getByText("Metro Tech Labs")));

  firstReactivation.resolve(
    jsonResponse(createListResponse([companyListItems[0]], 2, 15)),
  );
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  assert.ok(view.getByText("Metro Tech Labs"));
  assert.equal(view.queryByText("Dar Al feker"), null);
});
