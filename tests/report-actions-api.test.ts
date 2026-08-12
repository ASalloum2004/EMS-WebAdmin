import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { ApiRequestError } from "../src/api/apiClient.js";
import {
  buildRejectReportPath,
  buildResolveReportPath,
  rejectReport,
  resolveReport,
} from "../src/features/reports/api/reportActionsApi.js";

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

beforeEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "report-actions-api-token" })
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

test("builds the documented resolved and rejected Report paths", () => {
  assert.equal(buildResolveReportPath(7), "reports/7/resolved");
  assert.equal(buildRejectReportPath(8), "reports/8/rejected");

  for (const invalidId of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => buildResolveReportPath(invalidId));
    assert.throws(() => buildRejectReportPath(invalidId));
  }
});

test("Resolve posts the exact optional notes payload to the documented endpoint", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestedUrl = getRequestedUrl(input);
    requestedInit = init;

    return new Response("{}", {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const response = await resolveReport(7, {
    notes: "Resolved after administrator review.",
  });
  const headers = new Headers(requestedInit?.headers);

  assert.deepEqual(response, {});
  assert.equal(
    new URL(requestedUrl).pathname,
    "/api/v1/admin/reports/7/resolved",
  );
  assert.equal(requestedInit?.method, "POST");
  assert.equal(
    requestedInit?.body,
    JSON.stringify({ notes: "Resolved after administrator review." }),
  );
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(
    headers.get("Authorization"),
    "Bearer report-actions-api-token",
  );
});

test("Reject posts nullable notes and omitted notes remain optional", async () => {
  const requests: Array<{ body: BodyInit | null | undefined; path: string }> =
    [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      body: init?.body,
      path: new URL(getRequestedUrl(input)).pathname,
    });

    return new Response("{}", {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  await rejectReport(8, { notes: null });
  await resolveReport(9);

  assert.deepEqual(requests, [
    {
      body: JSON.stringify({ notes: null }),
      path: "/api/v1/admin/reports/8/rejected",
    },
    {
      body: JSON.stringify({}),
      path: "/api/v1/admin/reports/9/resolved",
    },
  ]);
});

test("Report actions preserve documented validation messages and field errors", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        errors: { notes: ["The notes field is invalid."] },
        message: "The given data was invalid.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 422,
      },
    );

  await assert.rejects(
    () => rejectReport(8, { notes: "Invalid" }),
    (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 422);
      assert.equal(error.message, "The given data was invalid.");
      assert.deepEqual(error.errors, {
        notes: ["The notes field is invalid."],
      });
      return true;
    },
  );
});
