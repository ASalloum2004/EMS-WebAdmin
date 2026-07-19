import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRejectBoothRequestPath,
  normalizeBoothRequestActionResponse,
  rejectBoothRequest,
} from "../src/features/order/api/index.js";
import type { BoothRequestActionResponse } from "../src/features/order/types.js";

const rejectSuccessResponse: BoothRequestActionResponse = {
  status: true,
  message: "request rejected successfully",
  data: null,
};

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
  }
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
