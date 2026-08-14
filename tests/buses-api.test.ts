import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  buildBusesPath,
  createBus,
  deleteBus,
  getBuses,
  normalizeBusesResponse,
  updateBus,
} from "../src/features/management/api/busesApi.js";

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
        key === "auth_session" ? JSON.stringify({ token: "test-token" }) : null,
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

const bus = {
  id: 1,
  location: "Damascus",
  start_time: "08:00:00",
  end_time: "21:00:00",
  duration: 45,
};

test("normalizes Bus list data and backend pagination metadata", () => {
  const result = normalizeBusesResponse({
    status: true,
    message: "Success",
    data: {
      data: [bus],
      current_page: 2,
      per_page: 3,
      total: 4,
      last_page: 2,
    },
  });

  assert.deepEqual(result, {
    buses: [bus],
    pagination: {
      currentPage: 2,
      perPage: 3,
      totalItems: 4,
      totalPages: 2,
    },
  });
});

test("builds Bus requests with the exact location filter", () => {
  assert.equal(
    buildBusesPath({ location: "Damascus", page: 2, perPage: 3 }),
    "buses?filter%5Blocation%5D=Damascus&per_page=3&page=2",
  );
  assert.equal(buildBusesPath({ location: "   " }), "buses");
});

test("uses the documented Bus methods and JSON payloads", async () => {
  const requests: Array<{
    body: string | undefined;
    method: string;
    url: string;
  }> = [];

  globalThis.fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    const body = init?.body ?? request?.body;
    requests.push({
      body: typeof body === "string" ? body : undefined,
      method: init?.method ?? request?.method ?? "GET",
      url: typeof input === "string" ? input : input.toString(),
    });

    return new Response(
      JSON.stringify({
        status: true,
        message: "Success",
        data:
          init?.method === "DELETE"
            ? null
            : init?.method === "GET"
              ? {
                  data: [bus],
                  current_page: 1,
                  per_page: 3,
                  total: 1,
                  last_page: 1,
                }
              : bus,
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 },
    );
  };

  const payload = {
    location: "Damascus",
    start_time: "08:00:00",
    end_time: "21:00:00",
    duration: 45,
  };

  await getBuses({ location: "Damascus", perPage: 3, page: 1 });
  await createBus(payload);
  await updateBus(1, payload);
  await deleteBus(1);

  assert.match(
    requests[0]?.url ?? "",
    /\/buses\?filter%5Blocation%5D=Damascus&per_page=3&page=1$/,
  );
  assert.equal(requests[0]?.method, "GET");
  assert.equal(requests[1]?.method, "POST");
  assert.equal(requests[1]?.body, JSON.stringify(payload));
  assert.match(requests[2]?.url ?? "", /\/buses\/1$/);
  assert.equal(requests[2]?.method, "PATCH");
  assert.equal(requests[2]?.body, JSON.stringify(payload));
  assert.match(requests[3]?.url ?? "", /\/buses\/1$/);
  assert.equal(requests[3]?.method, "DELETE");
  assert.equal(requests[3]?.body, undefined);
});
