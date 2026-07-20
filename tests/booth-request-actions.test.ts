import assert from "node:assert/strict";
import test from "node:test";
import {
  approveBoothRequest,
  buildApproveBoothRequestPath,
  buildRejectBoothRequestPath,
  normalizeApproveBoothRequestResponse,
  normalizeBoothRequestActionResponse,
  rejectBoothRequest,
} from "../src/features/order/api/index.js";
import type { BoothRequestActionResponse } from "../src/features/order/types.js";

const rejectSuccessResponse: BoothRequestActionResponse = {
  status: true,
  message: "request rejected successfully",
  data: null,
};

const approveSuccessResponse = {
  status: true as const,
  message: "request approved successfully",
  data: null,
};

test("builds the Approve endpoint with the booth request id", () => {
  assert.equal(
    buildApproveBoothRequestPath(901),
    "booths/requests/approve/901",
  );
  assert.equal(
    buildApproveBoothRequestPath(901, 2),
    "booths/requests/approve/901?page=2",
  );
});

test("builds the Reject endpoint with the booth request id", () => {
  assert.equal(
    buildRejectBoothRequestPath(901),
    "booths/requests/reject/901",
  );
});

test("rejects invalid booth request ids before sending a request", () => {
  for (const invalidId of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildRejectBoothRequestPath(invalidId),
      /valid booth request ID/i,
    );
    assert.throws(
      () => buildApproveBoothRequestPath(invalidId),
      /valid booth request ID/i,
    );
  }

  for (const invalidPage of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => buildApproveBoothRequestPath(901, invalidPage),
      /valid conflict page/i,
    );
  }
});

test("normalizes successful Approve responses and rejects status false", () => {
  assert.deepEqual(
    normalizeApproveBoothRequestResponse({
      ...approveSuccessResponse,
      message: "  request approved successfully  ",
    }),
    approveSuccessResponse,
  );

  assert.throws(
    () =>
      normalizeApproveBoothRequestResponse({
        status: false,
        message: "Booth is no longer available.",
        data: null,
      }),
    /Booth is no longer available/,
  );
});

test("normalizes the successful Reject response", () => {
  assert.deepEqual(
    normalizeBoothRequestActionResponse({
      ...rejectSuccessResponse,
      message: "  request rejected successfully  ",
    }),
    rejectSuccessResponse,
  );
});

test("sends an authenticated PATCH request without a body", async () => {
  const originalFetch = globalThis.fetch;
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  let requestedUrl = "";
  let requestBody: BodyInit | null | undefined;
  let requestHeaders = new Headers();
  let requestMethod = "";

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "reject-test-token" })
          : null,
    } as Storage,
  });

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestBody = init?.body;
    requestHeaders = new Headers(init?.headers);
    requestMethod = init?.method ?? "";

    return new Response(JSON.stringify(rejectSuccessResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await rejectBoothRequest(901);
    const url = new URL(requestedUrl);

    assert.deepEqual(response, rejectSuccessResponse);
    assert.equal(
      url.pathname,
      "/api/v1/admin/booths/requests/reject/901",
    );
    assert.equal(requestMethod, "PATCH");
    assert.equal(requestBody, undefined);
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer reject-test-token",
    );
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
});

test("sends authenticated Approve POST with force false", async () => {
  const originalFetch = globalThis.fetch;
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  let requestedUrl = "";
  let requestBody: BodyInit | null | undefined;
  let requestHeaders = new Headers();
  let requestMethod = "";

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "approve-test-token" })
          : null,
    } as Storage,
  });

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestBody = init?.body;
    requestHeaders = new Headers(init?.headers);
    requestMethod = init?.method ?? "";

    return new Response(JSON.stringify(approveSuccessResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const response = await approveBoothRequest(901);
    const url = new URL(requestedUrl);

    assert.deepEqual(response, {
      kind: "approved",
      response: approveSuccessResponse,
    });
    assert.equal(
      url.pathname,
      "/api/v1/admin/booths/requests/approve/901",
    );
    assert.equal(requestMethod, "POST");
    assert.deepEqual(JSON.parse(String(requestBody)), { force: false });
    assert.equal(
      requestHeaders.get("Authorization"),
      "Bearer approve-test-token",
    );
    assert.equal(requestHeaders.get("Content-Type"), "application/json");
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
});

test("normalizes a valid 409 Approve conflict and requests conflict pages safely", async () => {
  const originalFetch = globalThis.fetch;
  const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  let requestedUrl = "";
  let requestBody: BodyInit | null | undefined;

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "approve-conflict-test-token" })
          : null,
    } as Storage,
  });

  globalThis.fetch = async (input, init) => {
    requestedUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    requestBody = init?.body;

    return new Response(
      JSON.stringify({
        status: false,
        message: "Conflicting requests retrieved",
        errors: {
          data: {
            data: [
              {
                id: 5,
                booth_id: 8,
                company_id: 2,
                status: "pending",
                final_price: 160,
              },
              {
                id: null,
                booth_id: null,
                company_id: null,
                status: null,
                final_price: null,
              },
            ],
            meta: {
              current_page: 2,
              per_page: 3,
              total: 5,
              last_page: 2,
            },
          },
        },
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
  };

  try {
    const result = await approveBoothRequest(901, {
      force: false,
      page: 2,
    });
    const url = new URL(requestedUrl);

    assert.deepEqual(result, {
      kind: "conflict",
      message: "Conflicting requests retrieved",
      requests: [
        {
          id: 5,
          booth_id: 8,
          company_id: 2,
          status: "pending",
          final_price: 160,
        },
        {
          id: null,
          booth_id: null,
          company_id: null,
          status: null,
          final_price: null,
        },
      ],
      meta: {
        current_page: 2,
        per_page: 3,
        total: 5,
        last_page: 2,
      },
    });
    assert.equal(url.searchParams.get("page"), "2");
    assert.deepEqual(JSON.parse(String(requestBody)), { force: false });
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
});
