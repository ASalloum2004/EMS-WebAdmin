import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  buildBoothsPath,
  getBooths,
  normalizeBoothsResponse,
} from "../src/features/management/api/boothsApi.js";
import type { BoothsResponse } from "../src/features/management/types.js";

const booth = {
  id: 1,
  number: "SE_01",
  qr_token: null,
  area: 18,
  price: "450.00",
  svg_id: "SE_01",
  is_booked: false,
  created_at: "2026-07-21T14:01:10.000000Z",
};

const paginatedResponse: BoothsResponse = {
  status: true,
  message: "Booths retrieved successfully.",
  data: {
    data: [booth],
    current_page: 1,
    per_page: 10,
    total: 461,
    last_page: 47,
  },
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "booths-api-token" })
          : null,
    } as Storage,
  });
});

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

test("builds default, page-two, and safely normalized Booth paths", () => {
  assert.equal(buildBoothsPath(), "booths?page=1&per_page=10");
  assert.equal(
    buildBoothsPath({ page: 2, perPage: 10 }),
    "booths?page=2&per_page=10",
  );
  assert.equal(
    buildBoothsPath({ page: Number.NaN, perPage: -4 }),
    "booths?page=1&per_page=10",
  );
  assert.equal(
    buildBoothsPath({ page: 2.5, perPage: Number.POSITIVE_INFINITY }),
    "booths?page=1&per_page=10",
  );
});

test("builds encoded Booth backend filters without empty values", () => {
  const emptyUrl = new URL(
    buildBoothsPath({ number: "   " }),
    "https://example.test/",
  );

  assert.equal(emptyUrl.searchParams.get("page"), "1");
  assert.equal(emptyUrl.searchParams.get("per_page"), "10");
  assert.equal(emptyUrl.searchParams.has("filter[number]"), false);
  assert.equal(emptyUrl.searchParams.has("filter[booked]"), false);
  assert.equal(emptyUrl.searchParams.has("filter[min_area]"), false);
  assert.equal(emptyUrl.searchParams.has("filter[max_area]"), false);
  assert.equal(emptyUrl.searchParams.has("filter[min_price]"), false);
  assert.equal(emptyUrl.searchParams.has("filter[max_price]"), false);

  const path = buildBoothsPath({ number: "  SE 06/&  " });
  const encodedUrl = new URL(path, "https://example.test/");

  assert.match(path, /filter%5Bnumber%5D=SE\+06%2F%26/);
  assert.equal(encodedUrl.searchParams.get("filter[number]"), "SE 06/&");
});

test("preserves both Booth booking booleans and numeric zero filters", () => {
  const bookedUrl = new URL(
    buildBoothsPath({ booked: true }),
    "https://example.test/",
  );
  const availableUrl = new URL(
    buildBoothsPath({
      booked: false,
      maxArea: 0,
      maxPrice: 0,
      minArea: 0,
      minPrice: 0,
    }),
    "https://example.test/",
  );

  assert.equal(bookedUrl.searchParams.get("filter[booked]"), "true");
  assert.equal(availableUrl.searchParams.get("filter[booked]"), "false");
  assert.equal(availableUrl.searchParams.get("filter[min_area]"), "0");
  assert.equal(availableUrl.searchParams.get("filter[max_area]"), "0");
  assert.equal(availableUrl.searchParams.get("filter[min_price]"), "0");
  assert.equal(availableUrl.searchParams.get("filter[max_price]"), "0");
});

test("composes every Booth filter with backend pagination", () => {
  const url = new URL(
    buildBoothsPath({
      booked: false,
      maxArea: 25,
      maxPrice: 625,
      minArea: 20,
      minPrice: 500,
      number: " SE_06 ",
      page: 2,
      perPage: 25,
    }),
    "https://example.test/",
  );

  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("per_page"), "25");
  assert.equal(url.searchParams.get("filter[number]"), "SE_06");
  assert.equal(url.searchParams.get("filter[booked]"), "false");
  assert.equal(url.searchParams.get("filter[min_area]"), "20");
  assert.equal(url.searchParams.get("filter[max_area]"), "25");
  assert.equal(url.searchParams.get("filter[min_price]"), "500");
  assert.equal(url.searchParams.get("filter[max_price]"), "625");
  assert.equal(url.searchParams.has("search"), false);
  assert.equal(url.searchParams.has("filter[id]"), false);
});

test("requests authenticated Booth page one and normalizes nested metadata", async () => {
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

    return new Response(JSON.stringify(paginatedResponse), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const result = await getBooths({ page: 1, perPage: 10 });
  const url = new URL(requestedUrl);
  const headers = new Headers(requestedInit?.headers);

  assert.equal(url.pathname, "/api/v1/admin/booths");
  assert.equal(url.searchParams.get("page"), "1");
  assert.equal(url.searchParams.get("per_page"), "10");
  assert.equal(requestedInit?.method, "GET");
  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), "Bearer booths-api-token");
  assert.deepEqual(result.booths, [booth]);
  assert.equal(result.booths[0]?.qr_token, null);
  assert.deepEqual(result.pagination, {
    currentPage: 1,
    perPage: 10,
    totalItems: 461,
    totalPages: 47,
  });
});

test("requests Booth page two with the backend page parameters", async () => {
  let requestedUrl = "";

  globalThis.fetch = async (input) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    return new Response(
      JSON.stringify({
        ...paginatedResponse,
        data: {
          ...paginatedResponse.data,
          current_page: 2,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  };

  const result = await getBooths({ page: 2, perPage: 10 });
  const url = new URL(requestedUrl);

  assert.equal(url.searchParams.get("page"), "2");
  assert.equal(url.searchParams.get("per_page"), "10");
  assert.equal(result.pagination.currentPage, 2);
});

test("rejects invalid Booth response and pagination shapes", () => {
  const invalidResponses: unknown[] = [
    { status: true, message: "Success", data: [booth] },
    { ...paginatedResponse, status: "true" },
    {
      ...paginatedResponse,
      data: { ...paginatedResponse.data, current_page: 0 },
    },
    {
      ...paginatedResponse,
      data: { ...paginatedResponse.data, per_page: 1.5 },
    },
    {
      ...paginatedResponse,
      data: { ...paginatedResponse.data, total: -1 },
    },
    {
      ...paginatedResponse,
      data: { ...paginatedResponse.data, last_page: 0 },
    },
    {
      ...paginatedResponse,
      data: { ...paginatedResponse.data, current_page: 48 },
    },
    {
      ...paginatedResponse,
      data: {
        ...paginatedResponse.data,
        data: [{ ...booth, qr_token: 5 }],
      },
    },
  ];

  for (const response of invalidResponses) {
    assert.throws(
      () => normalizeBoothsResponse(response as BoothsResponse),
      /Unexpected booths response format/,
    );
  }
});
