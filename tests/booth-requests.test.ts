import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BOOTH_REQUESTS_PER_PAGE,
  buildBoothRequestsPath,
  getBoothRequests,
  normalizeBoothRequestsResponse,
} from "../src/features/order/api/boothRequestsApi.js";
import { getBoothRequestColumns } from "../src/features/order/components/orderTableColumns.js";
import {
  applyBoothRequestFilters,
  clearBoothRequestFilters,
  createEmptyBoothRequestFilters,
  getBoothRequestFilterParams,
} from "../src/features/order/hooks/useBoothRequestFilters.js";
import { isLatestBoothRequestsRequest } from "../src/features/order/hooks/useBoothRequests.js";
import type {
  BoothRequestFilters,
  BoothRequestsResponse,
} from "../src/features/order/types.js";
import { en } from "../src/i18n/locales/en.js";

const boothRequestsResponse: BoothRequestsResponse = {
  status: true,
  message: "booth requests retrived successfully",
  data: {
    data: Array.from({ length: 5 }, (_, index) => ({
      id: index + 1,
      booth_id: 1,
      company_id: index + 1,
      company_name: index === 0 ? "GreenFoods Co." : null,
      company:
        index === 0
          ? {
              id: 1,
              name: "GreenFoods Co.",
              business_sector: null,
              phone: null,
              description: null,
              year_founded: null,
              social_links: null,
              headquarters_lat: 0,
              headquarters_lng: 0,
              status: null,
            }
          : undefined,
      status: "approved",
      reason_for_booking: "Exhibitor booth request created for Elcoach.",
      final_price: 250,
      created_at: "2026-07-14 10:01:00",
    })),
    current_page: 1,
    per_page: 5,
    total: 10,
    last_page: 2,
  },
};

test("normalizes booth requests from the nested response structure", () => {
  const result = normalizeBoothRequestsResponse(boothRequestsResponse);

  assert.equal(result.requests.length, 5);
  assert.equal(result.requests[0]?.id, 1);
  assert.equal(result.requests[0]?.company_name, "GreenFoods Co.");
  assert.equal(result.requests[0]?.company?.name, "GreenFoods Co.");
});

test("maps nested booth request pagination metadata", () => {
  const result = normalizeBoothRequestsResponse(boothRequestsResponse);

  assert.deepEqual(result.pagination, {
    currentPage: 1,
    perPage: 5,
    totalItems: 10,
    totalPages: 2,
  });
});

test("uses five booth requests per page by default", () => {
  const searchParams = getPathSearchParams(buildBoothRequestsPath());

  assert.equal(DEFAULT_BOOTH_REQUESTS_PER_PAGE, 5);
  assert.equal(searchParams.get("page"), "1");
  assert.equal(searchParams.get("per_page"), "5");
});

test("builds page-one and page-two booth request paths", () => {
  assert.equal(
    buildBoothRequestsPath({ page: 1, perPage: 5 }),
    "booths/requests?page=1&per_page=5",
  );
  assert.equal(
    buildBoothRequestsPath({ page: 2, perPage: 5 }),
    "booths/requests?page=2&per_page=5",
  );
});

test("preserves reason_for_booking and final_price in fetched requests", async () => {
  const originalFetch = globalThis.fetch;
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  let requestedUrl = "";

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session" ? JSON.stringify({ token: "test-token" }) : null,
    } as Storage,
  });

  globalThis.fetch = async (input) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    return new Response(JSON.stringify(boothRequestsResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const result = await getBoothRequests({ page: 1, perPage: 5 });

    assert.equal(
      result.requests[0]?.reason_for_booking,
      "Exhibitor booth request created for Elcoach.",
    );
    assert.equal(result.requests[0]?.final_price, 250);
  } finally {
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
  }

  const url = new URL(requestedUrl);
  assert.equal(url.pathname, "/api/v1/admin/booths/requests");
  assert.equal(url.searchParams.get("per_page"), "5");
  assert.equal(url.searchParams.get("page"), "1");
});

test("main booth request columns exclude detail-only fields", () => {
  const columnKeys = getBoothRequestColumns(en, "en").map(
    (column) => column.key,
  );

  assert.deepEqual(columnKeys, [
    "company_id",
    "booth_id",
    "status",
    "created_at",
  ]);
  assert.equal(columnKeys.includes("id"), false);
  assert.equal(columnKeys.includes("reason_for_booking"), false);
  assert.equal(columnKeys.includes("final_price"), false);
});

test("normalizes an empty booth request list", () => {
  const result = normalizeBoothRequestsResponse({
    ...boothRequestsResponse,
    data: {
      ...boothRequestsResponse.data,
      data: [],
      last_page: 1,
      total: 0,
    },
  });

  assert.deepEqual(result.requests, []);
  assert.equal(result.pagination.totalItems, 0);
});

test("detects stale booth request pagination responses", () => {
  assert.equal(isLatestBoothRequestsRequest(1, 2), false);
  assert.equal(isLatestBoothRequestsRequest(2, 2), true);
});

function getPathSearchParams(path: string) {
  return new URL(path, "https://ems.test").searchParams;
}

test("all status omits filter[status]", () => {
  const filters = createEmptyBoothRequestFilters();
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({
      ...getBoothRequestFilterParams(filters),
      page: 1,
      perPage: 5,
    }),
  );

  assert.equal(searchParams.has("filter[status]"), false);
});

test("pending status sends filter[status]=pending", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ status: "pending" }),
  );

  assert.equal(searchParams.get("filter[status]"), "pending");
});

test("approved status sends filter[status]=approved", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ status: "approved" }),
  );

  assert.equal(searchParams.get("filter[status]"), "approved");
});

test("rejected status sends filter[status]=rejected", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ status: "rejected" }),
  );

  assert.equal(searchParams.get("filter[status]"), "rejected");
});

test("selected date sends filter[created_date] in YYYY-MM-DD format", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ createdDate: "2026-07-14" }),
  );

  assert.equal(searchParams.get("filter[created_date]"), "2026-07-14");
});

test("empty date omits filter[created_date]", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ createdDate: "" }),
  );

  assert.equal(searchParams.has("filter[created_date]"), false);
});

test("newest sorting sends sort=-created_at", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ sort: "-created_at" }),
  );

  assert.equal(searchParams.get("sort"), "-created_at");
});

test("oldest sorting sends sort=created_at", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({ sort: "created_at" }),
  );

  assert.equal(searchParams.get("sort"), "created_at");
});

test("clearing removes status, date, and sorting parameters", () => {
  const filters = clearBoothRequestFilters();
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({
      ...getBoothRequestFilterParams(filters),
      page: 1,
      perPage: 5,
    }),
  );

  assert.equal(searchParams.has("filter[status]"), false);
  assert.equal(searchParams.has("filter[created_date]"), false);
  assert.equal(searchParams.has("sort"), false);
});

test("applying or clearing filters resets pagination to page one", () => {
  const draftFilters: BoothRequestFilters = {
    createdDate: "2026-07-14",
    sort: "-created_at",
    status: "pending",
  };
  let currentPage = 4;
  const resetPage = () => {
    currentPage = 1;
  };

  applyBoothRequestFilters(draftFilters, resetPage);
  assert.equal(currentPage, 1);

  currentPage = 3;
  clearBoothRequestFilters(resetPage);
  assert.equal(currentPage, 1);
});

test("filters work together with page and per_page", () => {
  const searchParams = getPathSearchParams(
    buildBoothRequestsPath({
      createdDate: "2026-07-14",
      page: 2,
      perPage: 5,
      sort: "-created_at",
      status: "pending",
    }),
  );

  assert.equal(searchParams.get("page"), "2");
  assert.equal(searchParams.get("per_page"), "5");
  assert.equal(searchParams.get("filter[status]"), "pending");
  assert.equal(searchParams.get("filter[created_date]"), "2026-07-14");
  assert.equal(searchParams.get("sort"), "-created_at");
});

test("booth request paths never contain filter[name]", () => {
  const paths = [
    buildBoothRequestsPath(),
    buildBoothRequestsPath({ status: "pending" }),
    buildBoothRequestsPath({
      createdDate: "2026-07-14",
      page: 2,
      perPage: 5,
      sort: "created_at",
      status: "approved",
    }),
  ];

  for (const path of paths) {
    assert.equal(getPathSearchParams(path).has("filter[name]"), false);
  }
});

test("changing the local order search value does not add filter[name]", () => {
  let searchValue = "";
  const initialPath = buildBoothRequestsPath({ page: 2, perPage: 5 });

  searchValue = "Request 42";
  const pathAfterSearchChange = buildBoothRequestsPath({
    page: 2,
    perPage: 5,
  });

  assert.equal(searchValue, "Request 42");
  assert.equal(pathAfterSearchChange, initialPath);
  assert.equal(
    getPathSearchParams(pathAfterSearchChange).has("filter[name]"),
    false,
  );
  assert.equal(getPathSearchParams(pathAfterSearchChange).get("page"), "2");
});
