import assert from "node:assert/strict";
import test from "node:test";
import {
  buildServicesPath,
  getServices,
  normalizeServicesResponse,
} from "../src/features/management/api/servicesApi.js";
import { getNextServicePaginationState } from "../src/features/management/hooks/services/useServicePagination.js";
import { isLatestServicesRequest } from "../src/features/management/hooks/services/useServicesList.js";

const nestedServicesResponse = {
  status: true,
  message: "Services returned successfully.",
  data: {
    data: [
      {
        id: 1,
        name: "Booth Design",
        price: "150.00",
        is_active: true,
      },
      {
        id: 2,
        name: "Catering",
        price: "250.00",
        is_active: true,
      },
      {
        id: 3,
        name: "Audio Visual Support",
        price: "300.00",
        is_active: true,
      },
      {
        id: 4,
        name: "Security Staff",
        price: "180.00",
        is_active: true,
      },
      {
        id: 5,
        name: "Logistics Support",
        price: "220.00",
        is_active: true,
      },
    ],
    current_page: 1,
    per_page: 15,
    total: 5,
    last_page: 1,
  },
};

test("normalizes services from the nested response structure", () => {
  const result = normalizeServicesResponse(nestedServicesResponse);

  assert.equal(result.services.length, 5);
  assert.equal(result.services[0]?.name, "Booth Design");
});

test("normalizes nested pagination metadata", () => {
  const result = normalizeServicesResponse(nestedServicesResponse);

  assert.deepEqual(result.pagination, {
    currentPage: 1,
    perPage: 15,
    totalItems: 5,
    totalPages: 1,
  });
});

test("builds page-one and page-two services request paths", () => {
  assert.equal(
    buildServicesPath({ page: 1, perPage: 3 }),
    "service?per_page=3&page=1",
  );
  assert.equal(
    buildServicesPath({ page: 2, perPage: 3 }),
    "service?per_page=3&page=2",
  );
});

test("includes the active service filter when isActive is true", () => {
  assert.equal(
    buildServicesPath({ isActive: true }),
    "service?filter%5Bis_active%5D=true",
  );
});

test("includes the inactive service filter when isActive is false", () => {
  assert.equal(
    buildServicesPath({ isActive: false }),
    "service?filter%5Bis_active%5D=false",
  );
});

test("omits the active service filter for the all state", () => {
  assert.equal(buildServicesPath({ isActive: undefined }), "service");
});

test("passes the inactive value through getServices as false", async () => {
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

    return new Response(
      JSON.stringify({ status: true, message: "", data: [] }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    await getServices({ isActive: false });
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

  assert.match(
    requestedUrl,
    /\/service\?filter%5Bis_active%5D=false$/,
  );
  assert.equal(
    new URL(requestedUrl).searchParams.get("filter[is_active]"),
    "false",
  );
});

test("combines active status with service filters, sorting, and pagination", () => {
  assert.equal(
    buildServicesPath({
      isActive: false,
      maxPrice: 500,
      minPrice: 100,
      name: "Booth Design",
      page: 2,
      perPage: 25,
      sort: "-price",
    }),
    "service?filter%5Bname%5D=Booth+Design&filter%5Bmin_price%5D=100&filter%5Bmax_price%5D=500&filter%5Bis_active%5D=false&per_page=25&page=2&sort=-price",
  );
});

test("uses page one after applying or clearing the active status filter", () => {
  assert.equal(
    buildServicesPath({ isActive: true, page: 1, perPage: 3 }),
    "service?filter%5Bis_active%5D=true&per_page=3&page=1",
  );
  assert.equal(
    buildServicesPath({ page: 1, perPage: 3 }),
    "service?per_page=3&page=1",
  );

  const nextState = getNextServicePaginationState({
    currentPage: 1,
    itemCount: 3,
    meta: {
      perPage: 3,
      totalItems: 9,
      totalPages: 3,
    },
    perPage: 3,
  });

  assert.equal(nextState.currentPage, 1);
});

test("keeps the requested frontend page size when backend echoes a different per_page", () => {
  const result = normalizeServicesResponse(nestedServicesResponse);
  const nextState = getNextServicePaginationState({
    currentPage: 1,
    itemCount: result.services.length,
    meta: result.pagination,
    perPage: 3,
  });

  assert.deepEqual(nextState, {
    currentPage: 1,
    perPage: 3,
    totalItems: 5,
    totalPages: 2,
  });
});

test("uses consistent backend pagination metadata when it matches the requested page size", () => {
  const nextState = getNextServicePaginationState({
    currentPage: 1,
    itemCount: 3,
    meta: {
      currentPage: 1,
      perPage: 3,
      totalItems: 5,
      totalPages: 2,
    },
    perPage: 3,
  });

  assert.deepEqual(nextState, {
    currentPage: 1,
    perPage: 3,
    totalItems: 5,
    totalPages: 2,
  });
});

test("detects stale services responses", () => {
  assert.equal(isLatestServicesRequest(1, 2), false);
  assert.equal(isLatestServicesRequest(2, 2), true);
});
