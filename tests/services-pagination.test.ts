import assert from "node:assert/strict";
import test from "node:test";
import {
  buildServicesPath,
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
