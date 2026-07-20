import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildEventHallsPath,
  getEventHalls,
} from "../src/features/management/api/eventHallsApi.js";
import { updateEventHallPrice } from "../src/features/management/api/updateEventHallApi.js";
import type { EventHall } from "../src/features/management/types.js";

const eventHalls: EventHall[] = [
  { id: 1, number: "1", area: 100, price_per_hour: "50000.00" },
  { id: 2, number: "2", area: 150, price_per_hour: "75000.00" },
];

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function installAuthenticatedSession() {
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "event-halls-test-token" })
          : null,
    } as Storage,
  });

  return () => {
    if (sessionStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "sessionStorage",
        sessionStorageDescriptor,
      );
    } else {
      Reflect.deleteProperty(globalThis, "sessionStorage");
    }
  };
}

test("calls the authenticated Event Hall list endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  let requestedUrl = "";
  let requestHeaders = new Headers();
  let requestMethod = "";

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestHeaders = new Headers(init?.headers);
    requestMethod = init?.method ?? "";

    return new Response(
      JSON.stringify({ status: true, message: "Success", data: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await getEventHalls();
    const url = new URL(requestedUrl);

    assert.equal(url.pathname, "/api/v1/admin/eventHall");
    assert.equal(url.search, "");
    assert.equal(requestMethod, "GET");
    assert.equal(requestHeaders.get("Accept"), "application/json");
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer event-halls-test-token",
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("returns the direct Event Hall data array", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ status: true, message: "Success", data: eventHalls }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    assert.deepEqual(await getEventHalls(), eventHalls);
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("maps every Event Hall filter to its backend query parameter", () => {
  const url = new URL(
    buildEventHallsPath({
      maxArea: 200,
      maxPrice: 100000,
      minArea: 0,
      minPrice: 50000,
    }),
    "https://ems.test",
  );

  assert.equal(url.pathname, "/eventHall");
  assert.equal(url.searchParams.get("filter[min_area]"), "0");
  assert.equal(url.searchParams.get("filter[max_area]"), "200");
  assert.equal(url.searchParams.get("filter[min_price]"), "50000");
  assert.equal(url.searchParams.get("filter[max_price]"), "100000");
  assert.equal(Array.from(url.searchParams).length, 4);
});

test("includes multiple Event Hall filters together", () => {
  const url = new URL(
    buildEventHallsPath({ minArea: 100, maxArea: 200 }),
    "https://ems.test",
  );

  assert.deepEqual(Array.from(url.searchParams.entries()), [
    ["filter[min_area]", "100"],
    ["filter[max_area]", "200"],
  ]);
});

test("omits empty and invalid Event Hall filter parameters", () => {
  assert.equal(buildEventHallsPath({}), "eventHall");
  assert.equal(
    buildEventHallsPath({
      maxArea: undefined,
      maxPrice: Number.NaN,
      minArea: Number.POSITIVE_INFINITY,
    }),
    "eventHall",
  );
});

test("rejects an invalid Event Hall response format", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ status: true, message: "Success", data: {} }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    await assert.rejects(
      () => getEventHalls(),
      /Unexpected event halls response format\./,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("updates an Event Hall price through the authenticated PATCH endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();
  const updatedEventHall: EventHall = {
    ...eventHalls[0],
    price_per_hour: "75000.00",
  };
  let requestedUrl = "";
  let requestBody = "";
  let requestHeaders = new Headers();
  let requestMethod = "";

  globalThis.fetch = async (input, init) => {
    requestedUrl = getRequestUrl(input);
    requestBody = String(init?.body ?? "");
    requestHeaders = new Headers(init?.headers);
    requestMethod = init?.method ?? "";

    return new Response(
      JSON.stringify({
        status: true,
        message: "Success",
        data: updatedEventHall,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    assert.deepEqual(
      await updateEventHallPrice(1, { pricePerHour: 75000 }),
      updatedEventHall,
    );
    assert.equal(new URL(requestedUrl).pathname, "/api/v1/admin/eventHall/1");
    assert.equal(requestMethod, "PATCH");
    assert.deepEqual(JSON.parse(requestBody), { price_per_hour: 75000 });
    assert.equal(requestHeaders.get("Accept"), "application/json");
    assert.equal(requestHeaders.get("Content-Type"), "application/json");
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer event-halls-test-token",
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("preserves Event Hall price validation errors from the backend", async () => {
  const originalFetch = globalThis.fetch;
  const restoreSession = installAuthenticatedSession();

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: false,
        message: "The price per hour must be at least 0.",
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      },
    );

  try {
    await assert.rejects(
      () => updateEventHallPrice(1, { pricePerHour: -1 }),
      /The price per hour must be at least 0\./,
    );
  } finally {
    globalThis.fetch = originalFetch;
    restoreSession();
  }
});

test("the Management page no longer uses hardcoded Event Hall records", () => {
  const managementPageSource = readFileSync(
    "src/features/management/pages/ManagementPage.tsx",
    "utf8",
  );

  assert.doesNotMatch(managementPageSource, /\bconst EVENT_HALLS\b/);
});
