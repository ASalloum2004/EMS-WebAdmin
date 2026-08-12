import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiRequestError } from "../src/api/apiClient.js";
import {
  DEFAULT_REPORTS_PER_PAGE,
  buildReportsPath,
  getReports,
  normalizeReportsResponse,
} from "../src/features/reports/api/reportsApi.js";
import type {
  GetReportsParams,
  ReportsResponse,
} from "../src/features/reports/types.js";

const rawReport = {
  admin_notes: null,
  created_at: "2026-08-12T10:52:59.000000Z",
  description: "Backend-only report description.",
  id: 1,
  status: "pending" as const,
  title: "Outdated information",
};

const reportsResponse: ReportsResponse = {
  data: {
    current_page: 2,
    data: [rawReport],
    last_page: 3,
    per_page: 4,
    total: 10,
  },
  message: "Success",
  status: true,
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function getSearchParams(params: GetReportsParams = {}) {
  return new URL(buildReportsPath(params), "https://ems.invalid").searchParams;
}

function installGeneratedAuthSession() {
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

  return generatedToken;
}

afterEach(() => {
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

test("builds Reports paths with server pagination, search, and status", () => {
  assert.equal(DEFAULT_REPORTS_PER_PAGE, 4);
  assert.equal(buildReportsPath(), "reports?page=1&per_page=4");

  const searchParams = getSearchParams({
    page: 3,
    perPage: 8,
    search: "  incorrect information  ",
    status: "rejected",
  });

  assert.equal(searchParams.get("page"), "3");
  assert.equal(searchParams.get("per_page"), "8");
  assert.equal(
    searchParams.get("filter[search]"),
    "incorrect information",
  );
  assert.equal(searchParams.get("filter[status]"), "rejected");
  assert.equal(searchParams.has("include"), false);
  assert.equal(searchParams.has("sort"), false);
});

test("omits empty and unsupported Reports parameters", () => {
  const searchParams = getSearchParams({
    page: 0,
    perPage: Number.NaN,
    search: "   ",
    status: "unknown" as GetReportsParams["status"],
  });

  assert.equal(searchParams.get("page"), "1");
  assert.equal(searchParams.get("per_page"), "4");
  assert.equal(searchParams.has("filter[search]"), false);
  assert.equal(searchParams.has("filter[status]"), false);
});

test("normalizes the verified nested Reports response with internal report fields", () => {
  const result = normalizeReportsResponse(reportsResponse);

  assert.deepEqual(result, {
    pagination: {
      currentPage: 2,
      perPage: 4,
      totalItems: 10,
      totalPages: 3,
    },
    reports: [
      {
        admin_notes: null,
        created_at: "2026-08-12T10:52:59.000000Z",
        id: 1,
        status: "pending",
        title: "Outdated information",
      },
    ],
  });

  const tableRecord = result.reports[0] as Record<string, unknown>;
  assert.equal("description" in tableRecord, false);
  assert.equal("admin_notes" in tableRecord, true);
  assert.equal("id" in tableRecord, true);
});

test("uses requested and calculated pagination fallbacks", () => {
  const result = normalizeReportsResponse(
    {
      ...reportsResponse,
      data: {
        ...reportsResponse.data,
        current_page: 0,
        last_page: 0,
        per_page: 0,
        total: -1,
      },
    },
    { page: 4, perPage: 2 },
  );

  assert.deepEqual(result.pagination, {
    currentPage: 4,
    perPage: 2,
    totalItems: 1,
    totalPages: 1,
  });
});

test("rejects invalid Reports response shapes and statuses", () => {
  assert.throws(
    () =>
      normalizeReportsResponse({
        ...reportsResponse,
        data: {
          ...reportsResponse.data,
          data: null as unknown as ReportsResponse["data"]["data"],
        },
      }),
    /Unexpected reports response format/,
  );

  assert.throws(
    () =>
      normalizeReportsResponse({
        ...reportsResponse,
        data: {
          ...reportsResponse.data,
          data: [{ ...rawReport, status: "unknown" }] as unknown as ReportsResponse["data"]["data"],
        },
      }),
    /Unexpected reports response format/,
  );

  assert.throws(
    () =>
      normalizeReportsResponse({
        ...reportsResponse,
        data: {
          ...reportsResponse.data,
          data: [{ ...rawReport, admin_notes: 1 }] as unknown as ReportsResponse["data"]["data"],
        },
      }),
    /Unexpected reports response format/,
  );
});

test("fetches Reports with GET, authentication, and the Admin path", async () => {
  const generatedToken = installGeneratedAuthSession();
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestedInit = init;

    return new Response(JSON.stringify(reportsResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const result = await getReports({ page: 2, search: "information" });
  const url = new URL(requestedUrl);
  const headers = new Headers(requestedInit?.headers);

  assert.equal(url.pathname, "/api/v1/admin/reports");
  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("per_page"), "4");
  assert.equal(url.searchParams.get("filter[search]"), "information");
  assert.equal(requestedInit?.method, "GET");
  assert.equal(requestedInit?.cache, "no-store");
  assert.equal(headers.get("Authorization"), `Bearer ${generatedToken}`);
  assert.equal(result.reports.length, 1);
});

test("preserves backend Reports errors", async () => {
  installGeneratedAuthSession();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Reports unavailable." }), {
      headers: { "Content-Type": "application/json" },
      status: 503,
    });

  await assert.rejects(
    () => getReports(),
    (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 503);
      assert.equal(error.message, "Reports unavailable.");
      return true;
    },
  );
});
