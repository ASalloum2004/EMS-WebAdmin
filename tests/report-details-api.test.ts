import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiRequestError } from "../src/api/apiClient.js";
import {
  buildReportDetailsPath,
  getReportDetails,
  normalizeReportDetailsResponse,
} from "../src/features/reports/api/reportDetailsApi.js";
import type {
  ReportApiData,
  ReportDetailsResponse,
} from "../src/features/reports/types.js";

const report: ReportApiData = {
  admin_notes: "Reviewed by the moderation team.",
  created_at: "2026-08-12T10:52:59.000000Z",
  description: "The event information is no longer accurate.",
  id: 7,
  status: "pending",
  title: "Outdated information",
};

const response: ReportDetailsResponse = {
  data: report,
  message: "Success",
  status: true,
};

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

function installGeneratedAuthSession() {
  const token = `${Date.now()}-${Math.random()}`;

  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session" ? JSON.stringify({ token }) : null,
    } as Storage,
  });

  return token;
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

test("builds only valid Report details paths", () => {
  assert.equal(buildReportDetailsPath(7), "reports/7");
  assert.throws(() => buildReportDetailsPath(0));
  assert.throws(() => buildReportDetailsPath(-1));
  assert.throws(() => buildReportDetailsPath(1.5));
  assert.throws(() => buildReportDetailsPath(Number.NaN));
});

test("normalizes every confirmed Report details field and no unconfirmed fields", () => {
  const details = normalizeReportDetailsResponse({
    ...response,
    data: {
      ...report,
      reporter: { id: 99 },
    } as ReportApiData,
  });

  assert.deepEqual(details, report);
  assert.equal("reporter" in details, false);
});

test("accepts null admin notes and rejects invalid details shapes", () => {
  assert.equal(
    normalizeReportDetailsResponse({
      ...response,
      data: { ...report, admin_notes: null },
    }).admin_notes,
    null,
  );

  assert.throws(
    () =>
      normalizeReportDetailsResponse({
        ...response,
        data: {
          ...report,
          status: "unknown",
        } as unknown as ReportApiData,
      }),
    /Unexpected report details response format/,
  );
  assert.throws(
    () =>
      normalizeReportDetailsResponse({
        ...response,
        data: null as unknown as ReportApiData,
      }),
    /Unexpected report details response format/,
  );
});

test("fetches Report details with authenticated GET and the Admin path", async () => {
  const token = installGeneratedAuthSession();
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

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const details = await getReportDetails(7);
  const headers = new Headers(requestedInit?.headers);

  assert.equal(new URL(requestedUrl).pathname, "/api/v1/admin/reports/7");
  assert.equal(requestedInit?.method, "GET");
  assert.equal(requestedInit?.cache, "no-store");
  assert.equal(headers.get("Authorization"), `Bearer ${token}`);
  assert.deepEqual(details, report);
});

test("preserves backend Report details errors", async () => {
  installGeneratedAuthSession();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Report not found." }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
    });

  await assert.rejects(
    () => getReportDetails(7),
    (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "Report not found.");
      return true;
    },
  );
});
