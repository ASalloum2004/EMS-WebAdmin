import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiRequestError } from "../src/api/apiClient.js";
import {
  buildEventRequestDetailsPath,
  getEventRequestDetails,
  normalizeEventRequestDetailsResponse,
} from "../src/features/order/api/eventRequestDetailsApi.js";
import type {
  EventRequestDetailsApiData,
  EventRequestDetailsResponse,
} from "../src/features/order/types.js";

const rawDetails: EventRequestDetailsApiData = {
  id: 3,
  title: "The Future of Publishing",
  event_hall_id: 3,
  type: "conference",
  status: "approved",
  start_at: "2026-07-24T11:00:00.000000Z",
  end_at: "2026-07-24T14:00:00.000000Z",
  duration: 3,
  description: "A conference about publishing.",
  qr_token: "QR_METADATA_VALUE",
  eventable: {
    id: 1,
    name: "Dar Al feker",
    business_sector: "Lectures & Exhibitions",
    phone: "+963112223334",
    description: "Leading readers for reading.",
    year_founded: 2015,
    social_links: {
      website: "https://dar.com",
      linkedin: "https://linkedin.com/company/dar",
    },
    headquarters_lat: 33.513807,
    headquarters_lng: 36.276528,
    status: "pending",
  },
  speakers: [
    { id: 4, name: "Fawzy" },
    { id: 5, name: "Elcoach" },
  ],
  average_rating: null,
  qr_scans_count: 0,
  saved_count: 0,
  created_at: "2026-07-21T08:00:55.000000Z",
  logo: null,
};

function getResponse(
  data: EventRequestDetailsApiData = rawDetails,
): EventRequestDetailsResponse {
  return {
    status: true,
    message: "Success",
    data,
  };
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

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

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

test("builds only valid Event Request details paths", () => {
  assert.equal(
    buildEventRequestDetailsPath(3),
    "events/requests/3",
  );
  assert.throws(() => buildEventRequestDetailsPath(0));
  assert.throws(() => buildEventRequestDetailsPath(-1));
  assert.throws(() => buildEventRequestDetailsPath(1.5));
  assert.throws(() => buildEventRequestDetailsPath(Number.NaN));
});

test("normalizes all Event details while removing organizer coordinates", () => {
  const details = normalizeEventRequestDetailsResponse(getResponse());

  assert.equal(details.title, "The Future of Publishing");
  assert.equal(details.duration, 3);
  assert.deepEqual(details.speakers, rawDetails.speakers);
  assert.deepEqual(details.eventable, {
    id: 1,
    name: "Dar Al feker",
    business_sector: "Lectures & Exhibitions",
    phone: "+963112223334",
    description: "Leading readers for reading.",
    year_founded: 2015,
    social_links: {
      website: "https://dar.com",
      linkedin: "https://linkedin.com/company/dar",
    },
    status: "pending",
  });

  const organizer = details.eventable as Record<string, unknown>;
  assert.equal("headquarters_lat" in organizer, false);
  assert.equal("headquarters_lng" in organizer, false);
});

test("supports null organizer, empty speakers, and nullable metadata", () => {
  const details = normalizeEventRequestDetailsResponse(
    getResponse({
      ...rawDetails,
      average_rating: null,
      eventable: null,
      logo: null,
      qr_token: null,
      speakers: [],
    }),
  );

  assert.equal(details.eventable, null);
  assert.deepEqual(details.speakers, []);
  assert.equal(details.average_rating, null);
  assert.equal(details.qr_token, null);
  assert.equal(details.logo, null);
});

test("normalizes missing and partial organizer social links", () => {
  const details = normalizeEventRequestDetailsResponse(
    getResponse({
      ...rawDetails,
      eventable: {
        ...rawDetails.eventable!,
        social_links: { website: "https://dar.com" },
      },
    }),
  );

  assert.deepEqual(details.eventable?.social_links, {
    website: "https://dar.com",
    linkedin: null,
  });
});

test("rejects invalid Event Request details response objects and arrays", () => {
  assert.throws(
    () =>
      normalizeEventRequestDetailsResponse({
        ...getResponse(),
        data: {
          ...rawDetails,
          speakers: null as unknown as EventRequestDetailsApiData["speakers"],
        },
      }),
    /Unexpected event request details response format/,
  );

  assert.throws(
    () =>
      normalizeEventRequestDetailsResponse({
        ...getResponse(),
        data: null as unknown as EventRequestDetailsApiData,
      }),
    /Unexpected event request details response format/,
  );
});

test("fetches Event details with GET and shared authentication", async () => {
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

    return new Response(JSON.stringify(getResponse()), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  };

  const details = await getEventRequestDetails(3);
  const headers = new Headers(requestedInit?.headers);

  assert.equal(
    new URL(requestedUrl).pathname,
    "/api/v1/admin/events/requests/3",
  );
  assert.equal(requestedInit?.method, "GET");
  assert.equal(headers.get("Accept"), "application/json");
  assert.equal(headers.get("Authorization"), `Bearer ${generatedToken}`);
  assert.equal(details.id, 3);
});

for (const status of [401, 404]) {
  test(`preserves backend ${status} Event details errors`, async () => {
    installGeneratedAuthSession();
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ message: `Details request failed (${status}).` }),
        {
          headers: { "Content-Type": "application/json" },
          status,
        },
      );

    await assert.rejects(
      () => getEventRequestDetails(3),
      (error: unknown) => {
        assert.ok(error instanceof ApiRequestError);
        assert.equal(error.status, status);
        assert.equal(error.message, `Details request failed (${status}).`);
        return true;
      },
    );
  });
}
