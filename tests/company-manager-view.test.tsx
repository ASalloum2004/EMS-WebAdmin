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
  buildManagerDetailsPath,
  buildManagersPath,
  normalizeManagerDetailsResponse,
  normalizeManagerDirectoryResponse,
  normalizeManagersResponse,
} from "../src/features/company/api/index.js";
import { CompanyPage } from "../src/features/company/pages/CompanyPage.js";
import type {
  CompaniesApiResponse,
  ManagerDetailsApiResponse,
  ManagerDirectoryApiResponse,
  ManagersApiResponse,
} from "../src/features/company/types.js";
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

const managersResponse: ManagersApiResponse = {
  status: true,
  message: "managers retrieved successfully",
  data: {
    data: [
      {
        id: 3,
        name: "Elcoach",
        email: "zuheiralhomsi73@gmail.com",
        avatar: "/storage/managers/elcoach-list.png",
        companies_count: 6,
        booths_count: 2,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 16,
    last_page: 2,
  },
};

const managerDirectoryResponse: ManagerDirectoryApiResponse = {
  status: true,
  message: "statistics retrieved successfully",
  data: {
    total_companies: 6,
    total_booths: 461,
    total_managers: 1,
  },
};

const managerDetailsResponse: ManagerDetailsApiResponse = {
  status: true,
  message: "manager retrieved successfully",
  data: {
    id: 3,
    name: "Elcoach",
    email: "zuheiralhomsi73@gmail.com",
    avatar: "storage/managers/elcoach-details.png",
    portfolios: [
      {
        id: 1,
        name: "Dar Al feker",
        business_sector: "Lectures & Exhibitions",
        phone: "+963112223334",
        status: "approved",
        logo: "/storage/companies/dar-portfolio.png",
        booths: [
          {
            id: 43,
            number: "2C-01",
            hall: "2",
            label: "Booth 2-2C-01",
          },
        ],
      },
      {
        id: 2,
        name: "North Star Events",
        business_sector: "Event Management",
        phone: "+963115556667",
        status: "awaiting_review",
        logo: "file:///unsafe-logo.png",
        booths: [],
      },
    ],
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
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

test("builds exact manager search paths and normalizes API IDs out of visible details", () => {
  const nameUrl = new URL(
    buildManagersPath({ page: 2, search: " Elcoach ", searchField: "name" }),
    "https://example.test/",
  );
  assert.equal(nameUrl.pathname, "/managers");
  assert.equal(nameUrl.searchParams.get("filter[name]"), "Elcoach");
  assert.equal(nameUrl.searchParams.get("filter[email]"), null);
  assert.equal(nameUrl.searchParams.get("filter[phone]"), null);
  assert.equal(nameUrl.searchParams.get("page"), "2");

  const emailUrl = new URL(
    buildManagersPath({
      search: "zuheiralhomsi73@gmail.com",
      searchField: "email",
    }),
    "https://example.test/",
  );
  assert.equal(
    emailUrl.searchParams.get("filter[email]"),
    "zuheiralhomsi73@gmail.com",
  );
  assert.equal(emailUrl.searchParams.get("filter[name]"), null);

  const phoneUrl = new URL(
    buildManagersPath({ search: "+963", searchField: "phone" }),
    "https://example.test/",
  );
  assert.equal(phoneUrl.searchParams.get("filter[phone]"), "+963");
  assert.match(phoneUrl.search, /%2B963/);

  const emptyUrl = new URL(
    buildManagersPath({ search: "   ", searchField: "email" }),
    "https://example.test/",
  );
  assert.deepEqual(Array.from(emptyUrl.searchParams.keys()), ["page"]);

  const list = normalizeManagersResponse(managersResponse);
  assert.deepEqual(list.managers[0], {
    internalId: 3,
    name: "Elcoach",
    email: "zuheiralhomsi73@gmail.com",
    avatar:
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/elcoach-list.png",
    companiesCount: 6,
    boothsCount: 2,
  });
  assert.equal(Object.hasOwn(list.managers[0], "id"), false);

  assert.deepEqual(
    normalizeManagerDirectoryResponse(managerDirectoryResponse),
    {
      totalManagers: 1,
      managedCompanies: 6,
      managedBooths: 461,
    },
  );

  const details = normalizeManagerDetailsResponse(managerDetailsResponse);
  assert.equal(
    details.avatar,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/elcoach-details.png",
  );
  assert.equal(
    details.portfolios[0]?.logo,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-portfolio.png",
  );
  assert.equal(details.portfolios[1]?.logo, null);
  assert.equal(Object.hasOwn(details, "id"), false);
  assert.equal(Object.hasOwn(details.portfolios[0], "id"), false);
  assert.equal(Object.hasOwn(details.portfolios[0].booths[0], "id"), false);
  assert.deepEqual(details.portfolios[0].booths[0], {
    number: "2C-01",
    hall: "2",
    label: "Booth 2-2C-01",
  });
  assert.equal(buildManagerDetailsPath(3), "managers/3");
  assert.throws(() => buildManagerDetailsPath(0));
});

test("loads manager list, directory, searches server-side, paginates, and caches details", async () => {
  const managerListRequests: Array<{ headers: Headers; url: URL }> = [];
  let directoryRequestCount = 0;
  let detailsRequestCount = 0;

  globalThis.fetch = async (input, init) => {
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

    if (url.pathname.endsWith("/companies")) {
      return jsonResponse(companyResponse);
    }

    if (url.pathname.endsWith("/managers/directory")) {
      directoryRequestCount += 1;
      return jsonResponse(managerDirectoryResponse);
    }

    if (url.pathname.endsWith("/managers/3")) {
      detailsRequestCount += 1;
      return jsonResponse(managerDetailsResponse);
    }

    if (url.pathname.endsWith("/managers")) {
      managerListRequests.push({
        headers: new Headers(init?.headers),
        url,
      });
      const query =
        url.searchParams.get("filter[name]") ??
        url.searchParams.get("filter[email]") ??
        url.searchParams.get("filter[phone]") ??
        "";
      const page = Number(url.searchParams.get("page") ?? "1");
      const hasMatch = !query || /elcoach|zuheir|\+963/i.test(query);

      return jsonResponse({
        ...managersResponse,
        data: {
          ...managersResponse.data,
          current_page: page,
          data: hasMatch ? managersResponse.data.data : [],
          total: hasMatch ? 16 : 0,
          last_page: hasMatch ? 2 : 1,
        },
      } satisfies ManagersApiResponse);
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  const view = render(
    <I18nProvider>
      <CompanyPage />
    </I18nProvider>,
  );

  await waitFor(() => assert.ok(view.getByText("Dar Al feker")));
  fireEvent.click(view.getByRole("tab", { name: "View by Manager" }));

  await waitFor(() =>
    assert.ok(
      view.getByRole("button", {
        name: "Open manager details for Elcoach",
      }),
    ),
  );
  const managerRow = view.getByRole("button", {
    name: "Open manager details for Elcoach",
  });
  const managerAvatar = managerRow.querySelector("img");
  assert.ok(managerAvatar);
  assert.equal(
    managerAvatar.src,
    "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/elcoach-list.png",
  );
  assert.equal(directoryRequestCount, 1);
  assert.equal(managerListRequests.length, 1);
  assert.equal(
    managerListRequests[0].headers.get("Authorization"),
    "Bearer manager-view-test-token",
  );
  assert.equal(managerListRequests[0].url.searchParams.get("page"), "1");
  assert.equal(
    Array.from(managerListRequests[0].url.searchParams.keys()).some((key) =>
      key.startsWith("filter["),
    ),
    false,
  );

  const totalManagersCard = view
    .getByRole("heading", { name: "Total Managers" })
    .closest<HTMLElement>(".card");
  const companiesCard = view
    .getByRole("heading", { name: "Managed Companies" })
    .closest<HTMLElement>(".card");
  const boothsCard = view
    .getByRole("heading", { name: "Managed Booths" })
    .closest<HTMLElement>(".card");
  assert.ok(totalManagersCard);
  assert.ok(companiesCard);
  assert.ok(boothsCard);
  assert.ok(within(totalManagersCard).getByText("1"));
  assert.ok(within(companiesCard).getByText("6"));
  assert.ok(within(boothsCard).getByText("461"));
  assert.equal(view.queryByText(/matching managers/i), null);
  assert.equal(view.queryByLabelText("Rows per page"), null);
  assert.equal(view.queryByText("Actions"), null);
  assert.equal(view.queryByText("#3"), null);

  const searchField = view.getByRole("combobox", { name: "Search by" });
  const searchInput = view.getByRole("searchbox", {
    name: "Search managers by name",
  });
  fireEvent.change(searchInput, { target: { value: " Elcoach " } });
  await waitFor(
    () => {
      const latestRequest = managerListRequests.at(-1)?.url;
      assert.equal(latestRequest?.searchParams.get("filter[name]"), "Elcoach");
      assert.equal(latestRequest?.searchParams.get("filter[email]"), null);
      assert.equal(latestRequest?.searchParams.get("filter[phone]"), null);
      assert.equal(latestRequest?.searchParams.get("page"), "1");
    },
    { timeout: 1500 },
  );

  fireEvent.change(searchField, { target: { value: "email" } });
  await waitFor(() =>
    assert.ok(
      view.getByRole("searchbox", {
        name: "Search managers by email",
      }),
    ),
  );
  await waitFor(() => {
    const latestRequest = managerListRequests.at(-1)?.url;
    assert.equal(latestRequest?.searchParams.get("filter[email]"), "Elcoach");
    assert.equal(latestRequest?.searchParams.get("filter[name]"), null);
  });

  const emailInput = view.getByRole("searchbox", {
    name: "Search managers by email",
  });
  fireEvent.change(emailInput, {
    target: { value: "zuheiralhomsi73@gmail.com" },
  });
  await waitFor(
    () => {
      const latestRequest = managerListRequests.at(-1)?.url;
      assert.equal(
        latestRequest?.searchParams.get("filter[email]"),
        "zuheiralhomsi73@gmail.com",
      );
      assert.equal(latestRequest?.searchParams.get("page"), "1");
    },
    { timeout: 1500 },
  );

  fireEvent.change(searchField, { target: { value: "phone" } });
  const phoneInput = await view.findByRole("searchbox", {
    name: "Search managers by phone",
  });
  fireEvent.change(phoneInput, { target: { value: "+963" } });
  await waitFor(
    () => {
      const latestRequest = managerListRequests.at(-1)?.url;
      assert.equal(latestRequest?.searchParams.get("filter[phone]"), "+963");
      assert.match(latestRequest?.search ?? "", /%2B963/);
      assert.equal(latestRequest?.searchParams.get("filter[name]"), null);
      assert.equal(latestRequest?.searchParams.get("filter[email]"), null);
    },
    { timeout: 1500 },
  );

  const managerPanel = view.getByRole("tabpanel", {
    name: "Manager directory and controls",
  });
  fireEvent.click(within(managerPanel).getByRole("button", { name: "2" }));
  await waitFor(() => {
    const latestRequest = managerListRequests.at(-1)?.url;
    assert.equal(latestRequest?.searchParams.get("filter[phone]"), "+963");
    assert.equal(latestRequest?.searchParams.get("page"), "2");
  });
  assert.equal(directoryRequestCount, 1);

  fireEvent.change(phoneInput, { target: { value: "" } });
  await waitFor(
    () => {
      const latestRequest = managerListRequests.at(-1)?.url;
      assert.equal(latestRequest?.searchParams.get("page"), "1");
      assert.equal(latestRequest?.searchParams.get("filter[name]"), null);
      assert.equal(latestRequest?.searchParams.get("filter[email]"), null);
      assert.equal(latestRequest?.searchParams.get("filter[phone]"), null);
    },
    { timeout: 1500 },
  );

  fireEvent.click(
    view.getByRole("button", {
      name: "Open manager details for Elcoach",
    }),
  );
  const modal = view.getByRole("dialog", { name: "Manager details" });
  assert.equal(document.body.style.overflow, "hidden");
  await waitFor(() => assert.ok(within(modal).getByText("Dar Al feker")));
  const modalImages = modal.querySelectorAll("img");
  assert.equal(modalImages.length, 2);
  assert.deepEqual(
    Array.from(modalImages, (image) => image.src).sort(),
    [
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/managers/elcoach-details.png",
      "https://violations-salt-hybrid-springer.trycloudflare.com/storage/companies/dar-portfolio.png",
    ].sort(),
  );
  assert.ok(within(modal).getByText("Booth 2-2C-01"));
  assert.ok(within(modal).getByText("Awaiting Review"));
  assert.ok(within(modal).getByText("No booths assigned"));
  assert.equal(within(modal).queryByText("#3"), null);
  assert.equal(within(modal).queryByText("43"), null);
  assert.equal(detailsRequestCount, 1);

  fireEvent.click(
    view.getByRole("button", { name: "Close manager details" }),
  );
  fireEvent.click(
    view.getByRole("button", {
      name: "Open manager details for Elcoach",
    }),
  );
  await waitFor(() =>
    assert.ok(
      within(view.getByRole("dialog", { name: "Manager details" })).getByText(
        "Dar Al feker",
      ),
    ),
  );
  assert.equal(detailsRequestCount, 1);

  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(document.body.style.overflow, "");
});
