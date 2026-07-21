import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { useState } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DataTable } from "../src/components/DataTable/DataTable.js";
import {
  buildEventHallDetailsPath,
  getEventHallDetails,
  normalizeEventHallDetailsResponse,
} from "../src/features/management/api/eventHallDetailsApi.js";
import {
  formatEventHallDateTime,
  ManagementEventHallDetailsModal,
} from "../src/features/management/components/ManagementEventHallDetailsModal/ManagementEventHallDetailsModal.js";
import {
  getEventHallActions,
  getEventHallColumns,
} from "../src/features/management/components/tableColumns.js";
import { useEventHallDetails } from "../src/features/management/hooks/useEventHallDetails.js";
import type {
  BoothApiData,
  EventHall,
  EventHallDetails,
  EventHallDetailsResponse,
  EventHallEventApiData,
  HallApiData,
} from "../src/features/management/types.js";
import { I18nProvider, useI18n } from "../src/i18n/I18nContext.js";

const rawEvent: EventHallEventApiData = {
  id: 1,
  title: "Building Scalable Laravel Applications",
  event_hall_id: 1,
  type: "workshop",
  status: "approved",
  start_at: "2026-07-21T10:00:00.000000Z",
  end_at: "2026-07-21T12:00:00.000000Z",
  duration: 2,
  description:
    "A practical workshop about designing and scaling modern Laravel applications.",
  qr_token: "E-SEED-001",
  created_at: "2026-07-20T22:00:54.000000Z",
  logo: null,
};

const rawDetails = {
  id: 1,
  number: "1",
  area: 100,
  price_per_hour: "45454.00",
  events: [rawEvent],
};

const safeEvent = {
  id: rawEvent.id,
  title: rawEvent.title,
  event_hall_id: rawEvent.event_hall_id,
  type: rawEvent.type,
  status: rawEvent.status,
  start_at: rawEvent.start_at,
  end_at: rawEvent.end_at,
  duration: rawEvent.duration,
  description: rawEvent.description,
  created_at: rawEvent.created_at,
};

const safeDetails: EventHallDetails = {
  id: rawDetails.id,
  number: rawDetails.number,
  area: rawDetails.area,
  price_per_hour: rawDetails.price_per_hour,
  events: [safeEvent],
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function createDetailsResponse(
  data: EventHallDetailsResponse["data"],
  status = 200,
) {
  return new Response(
    JSON.stringify({ status: status < 400, message: "Success", data }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function EventHallDetailsHookHarness() {
  const { t } = useI18n();
  const detailsState = useEventHallDetails({
    errorFallback: t.management.eventHalls.details.errorFallback,
  });

  return (
    <div>
      <button type="button" onClick={() => detailsState.openDetails(1)}>
        Open Event Hall 1
      </button>
      <button type="button" onClick={() => detailsState.openDetails(2)}>
        Open Event Hall 2
      </button>
      <button type="button" onClick={detailsState.closeDetails}>
        Close Event Hall details
      </button>
      <button type="button" onClick={() => void detailsState.retry()}>
        Retry Event Hall details
      </button>
      <output aria-label="Selected Event Hall">
        {detailsState.selectedEventHallId ?? "none"}
      </output>
      <output aria-label="Event Hall details open">
        {detailsState.isOpen ? "open" : "closed"}
      </output>
      <output aria-label="Event Hall details loading">
        {detailsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Event Hall details value">
        {JSON.stringify(detailsState.eventHallDetails)}
      </output>
      {detailsState.error ? <p role="alert">{detailsState.error}</p> : null}
    </div>
  );
}

function renderDetailsHookHarness() {
  return render(
    <I18nProvider>
      <EventHallDetailsHookHarness />
    </I18nProvider>,
  );
}

function renderDetailsModal(
  props: Partial<
    Parameters<typeof ManagementEventHallDetailsModal>[0]
  > = {},
) {
  const defaultProps: Parameters<
    typeof ManagementEventHallDetailsModal
  >[0] = {
    details: safeDetails,
    error: "",
    eventHallId: 1,
    isLoading: false,
    onClose: () => undefined,
    onRetry: () => undefined,
  };

  return render(
    <I18nProvider>
      <ManagementEventHallDetailsModal {...defaultProps} {...props} />
    </I18nProvider>,
  );
}

function EventHallTableHarness() {
  const { t } = useI18n();
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [editedId, setEditedId] = useState<number | null>(null);
  const eventHalls: EventHall[] = [
    { id: 1, number: "1", area: 100, price_per_hour: "45454.00" },
  ];

  return (
    <>
      <DataTable
        actions={getEventHallActions(
          (eventHall) => setEditedId(eventHall.id),
          t.common.edit,
        )}
        ariaLabel={t.management.eventHalls.ariaLabel}
        columns={getEventHallColumns(t)}
        getItemAriaLabel={(eventHall) =>
          `${t.management.eventHalls.details.openAriaLabel} #${eventHall.id}`
        }
        getItemKey={(eventHall) => eventHall.id}
        items={eventHalls}
        onItemClick={(eventHall) => {
          setOpenedId(eventHall.id);
          setOpenCount((currentCount) => currentCount + 1);
        }}
      />
      <output aria-label="Opened Event Hall">{openedId ?? "none"}</output>
      <output aria-label="Event Hall open count">{openCount}</output>
      <output aria-label="Edited Event Hall">{editedId ?? "none"}</output>
    </>
  );
}

const originalFetch = globalThis.fetch;
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) =>
        key === "auth_session"
          ? JSON.stringify({ token: "event-hall-details-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  window.localStorage.clear();

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

test("requests and normalizes authenticated Event Hall details", async () => {
  let requestedUrl = "";
  let requestedMethod = "";
  let requestedHeaders = new Headers();

  globalThis.fetch = async (input, init) => {
    requestedUrl = getRequestUrl(input);
    requestedMethod = init?.method ?? "";
    requestedHeaders = new Headers(init?.headers);
    return createDetailsResponse(rawDetails);
  };

  const details = await getEventHallDetails(1);

  assert.equal(buildEventHallDetailsPath(1), "eventHall/1");
  assert.equal(new URL(requestedUrl).pathname, "/api/v1/admin/eventHall/1");
  assert.equal(requestedMethod, "GET");
  assert.equal(
    requestedHeaders.get("Authorization"),
    "Bearer event-hall-details-token",
  );
  assert.deepEqual(details, safeDetails);
  assert.equal("qr_token" in details.events[0], false);
  assert.equal("logo" in details.events[0], false);
});

test("normalizes zero, one, and multiple scheduled events", () => {
  const emptyDetails = normalizeEventHallDetailsResponse({
    status: true,
    message: "Success",
    data: { ...rawDetails, events: [] },
  });
  const oneEventDetails = normalizeEventHallDetailsResponse({
    status: true,
    message: "Success",
    data: rawDetails,
  });
  const multipleEventDetails = normalizeEventHallDetailsResponse({
    status: true,
    message: "Success",
    data: {
      ...rawDetails,
      events: [
        rawEvent,
        { ...rawEvent, id: 2, title: "Second scheduled event" },
      ],
    },
  });

  assert.equal(emptyDetails.events.length, 0);
  assert.equal(oneEventDetails.events.length, 1);
  assert.deepEqual(
    multipleEventDetails.events.map((event) => event.title),
    [rawEvent.title, "Second scheduled event"],
  );
  assert.equal("qr_token" in multipleEventDetails.events[1], false);
  assert.equal("logo" in multipleEventDetails.events[1], false);
});

test("rejects unexpected Event Hall details response shapes", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: true,
        message: "Success",
        data: { ...rawDetails, events: {} },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  await assert.rejects(
    () => getEventHallDetails(1),
    /Unexpected Event Hall details response format\./,
  );
});

test("preserves Event Hall details 401 and 404 errors", async () => {
  for (const [status, message] of [
    [401, "Unauthenticated."],
    [404, "Event Hall not found."],
  ] as const) {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ status: false, message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(() => getEventHallDetails(1), new RegExp(message));
  }
});

test("opens immediately, fetches once, and exposes loading and success", async () => {
  const request = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return request.promise;
  };
  const view = renderDetailsHookHarness();
  const openButton = view.getByRole("button", { name: "Open Event Hall 1" });

  fireEvent.click(openButton);
  fireEvent.click(openButton);

  assert.equal(view.getByLabelText("Event Hall details open").textContent, "open");
  assert.equal(view.getByLabelText("Selected Event Hall").textContent, "1");
  assert.equal(
    view.getByLabelText("Event Hall details loading").textContent,
    "loading",
  );
  assert.equal(requestCount, 1);

  await act(async () => {
    request.resolve(createDetailsResponse(rawDetails));
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Hall details value").textContent,
      JSON.stringify(safeDetails),
    ),
  );
  assert.equal(
    view.getByLabelText("Event Hall details loading").textContent,
    "idle",
  );
});

test("keeps details open on error and retries the same Event Hall ID", async () => {
  const requestedIds: string[] = [];
  globalThis.fetch = async (input) => {
    requestedIds.push(new URL(getRequestUrl(input)).pathname);

    if (requestedIds.length === 1) {
      return new Response(
        JSON.stringify({ status: false, message: "Event Hall unavailable." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return createDetailsResponse(rawDetails);
  };
  const view = renderDetailsHookHarness();

  fireEvent.click(view.getByRole("button", { name: "Open Event Hall 1" }));
  await waitFor(() =>
    assert.equal(view.getByRole("alert").textContent, "Event Hall unavailable."),
  );
  assert.equal(view.getByLabelText("Event Hall details open").textContent, "open");

  fireEvent.click(
    view.getByRole("button", { name: "Retry Event Hall details" }),
  );
  await waitFor(() => assert.equal(requestedIds.length, 2));
  assert.deepEqual(requestedIds, [
    "/api/v1/admin/eventHall/1",
    "/api/v1/admin/eventHall/1",
  ]);
});

test("closing prevents a late Event Hall details response from updating state", async () => {
  const request = createDeferred<Response>();
  globalThis.fetch = async () => request.promise;
  const view = renderDetailsHookHarness();

  fireEvent.click(view.getByRole("button", { name: "Open Event Hall 1" }));
  fireEvent.click(
    view.getByRole("button", { name: "Close Event Hall details" }),
  );

  await act(async () => {
    request.resolve(createDetailsResponse(rawDetails));
    await request.promise;
  });

  assert.equal(view.getByLabelText("Event Hall details open").textContent, "closed");
  assert.equal(view.getByLabelText("Selected Event Hall").textContent, "none");
  assert.equal(view.getByLabelText("Event Hall details value").textContent, "null");
});

test("an older Event Hall details response cannot overwrite a newer selection", async () => {
  const firstRequest = createDeferred<Response>();
  const secondRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return requestCount === 1 ? firstRequest.promise : secondRequest.promise;
  };
  const view = renderDetailsHookHarness();

  fireEvent.click(view.getByRole("button", { name: "Open Event Hall 1" }));
  fireEvent.click(view.getByRole("button", { name: "Open Event Hall 2" }));

  const secondDetails = {
    ...rawDetails,
    id: 2,
    number: "2",
    events: [{ ...rawEvent, id: 2, event_hall_id: 2 }],
  };
  await act(async () => {
    secondRequest.resolve(createDetailsResponse(secondDetails));
    await secondRequest.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Event Hall details value").textContent ?? "",
      /"id":2/,
    ),
  );

  await act(async () => {
    firstRequest.resolve(createDetailsResponse(rawDetails));
    await firstRequest.promise;
  });
  assert.match(
    view.getByLabelText("Event Hall details value").textContent ?? "",
    /"id":2/,
  );
});

test("a refresh supersedes in-flight details for the same Event Hall", async () => {
  const olderRequest = createDeferred<Response>();
  const refreshedRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return requestCount === 1
      ? olderRequest.promise
      : refreshedRequest.promise;
  };
  const view = renderDetailsHookHarness();

  fireEvent.click(view.getByRole("button", { name: "Open Event Hall 1" }));
  fireEvent.click(
    view.getByRole("button", { name: "Retry Event Hall details" }),
  );
  assert.equal(requestCount, 2);

  await act(async () => {
    refreshedRequest.resolve(
      createDetailsResponse({
        ...rawDetails,
        price_per_hour: "90000.00",
      }),
    );
    await refreshedRequest.promise;
  });
  await waitFor(() =>
    assert.match(
      view.getByLabelText("Event Hall details value").textContent ?? "",
      /"price_per_hour":"90000\.00"/,
    ),
  );

  await act(async () => {
    olderRequest.resolve(createDetailsResponse(rawDetails));
    await olderRequest.promise;
  });
  assert.match(
    view.getByLabelText("Event Hall details value").textContent ?? "",
    /"price_per_hour":"90000\.00"/,
  );
});

test("renders all allowed details and excludes restricted event fields", () => {
  const view = renderDetailsModal();
  const renderedText = view.container.textContent ?? "";

  assert.match(renderedText, /Event Hall Details/);
  assert.match(renderedText, /#1/);
  assert.match(renderedText, /45454\.00/);
  assert.match(renderedText, /Building Scalable Laravel Applications/);
  assert.match(renderedText, /Workshop/);
  assert.match(renderedText, /Approved/);
  assert.match(renderedText, /2 hours/);
  assert.match(renderedText, /A practical workshop/);
  assert.match(renderedText, /Event Hall ID/);
  assert.match(renderedText, /Created At/);
  assert.equal(renderedText.includes("qr_token"), false);
  assert.equal(renderedText.includes("logo"), false);
  assert.equal(renderedText.includes("E-SEED-001"), false);
});

test("renders intentional empty, one-event, and multiple-event states", () => {
  const view = renderDetailsModal({
    details: { ...safeDetails, events: [] },
  });
  assert.ok(view.getByText("No scheduled events for this Event Hall."));

  view.rerender(
    <I18nProvider>
      <ManagementEventHallDetailsModal
        details={{
          ...safeDetails,
          events: [
            safeEvent,
            { ...safeEvent, id: 2, title: "Second scheduled event" },
          ],
        }}
        error=""
        eventHallId={1}
        isLoading={false}
        onClose={() => undefined}
        onRetry={() => undefined}
      />
    </I18nProvider>,
  );

  assert.ok(view.getByText(rawEvent.title));
  assert.ok(view.getByText("Second scheduled event"));
  assert.ok(view.getByText("Event count: 2"));
});

test("formats valid dates and handles invalid dates safely", () => {
  const validDate = formatEventHallDateTime(
    rawEvent.start_at,
    "en",
    "Invalid date",
  );
  assert.notEqual(validDate, "Invalid date");
  assert.equal(
    formatEventHallDateTime("not-a-date", "en", "Invalid date"),
    "Invalid date",
  );

  const view = renderDetailsModal({
    details: {
      ...safeDetails,
      events: [
        {
          ...safeEvent,
          start_at: "not-a-date",
          end_at: "not-a-date",
          created_at: "not-a-date",
        },
      ],
    },
  });
  assert.equal(view.getAllByText("Invalid date").length, 3);
});

test("supports loading, errors, retry, close, Escape, and backdrop dismissal", () => {
  let closeCount = 0;
  let retryCount = 0;
  const view = renderDetailsModal({
    details: null,
    isLoading: true,
    onClose: () => {
      closeCount += 1;
    },
    onRetry: () => {
      retryCount += 1;
    },
  });

  assert.ok(view.getByText("Loading Event Hall details..."));
  view.rerender(
    <I18nProvider>
      <ManagementEventHallDetailsModal
        details={null}
        error="Backend details error."
        eventHallId={1}
        isLoading={false}
        onClose={() => {
          closeCount += 1;
        }}
        onRetry={() => {
          retryCount += 1;
        }}
      />
    </I18nProvider>,
  );

  assert.ok(view.getByText("Backend details error."));
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  assert.equal(retryCount, 1);
  fireEvent.click(
    view.getByRole("button", { name: "Close Event Hall details" }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(
    view.container.querySelector(".management-event-hall-details")!,
  );
  assert.equal(closeCount, 3);
});

test("Event Hall rows support click, Enter, and Space while Edit stays separate", () => {
  const view = render(
    <I18nProvider>
      <EventHallTableHarness />
    </I18nProvider>,
  );
  const row = view.getByRole("button", {
    name: "Open details for Event Hall #1",
  });

  fireEvent.click(row);
  assert.equal(view.getByLabelText("Opened Event Hall").textContent, "1");
  assert.equal(view.getByLabelText("Event Hall open count").textContent, "1");

  fireEvent.keyDown(row, { key: "Enter" });
  fireEvent.keyDown(row, { key: " " });
  assert.equal(view.getByLabelText("Event Hall open count").textContent, "3");

  const editButton = view.getByRole("button", { name: "Edit" });
  fireEvent.keyDown(editButton, { key: "Enter" });
  fireEvent.click(editButton);
  assert.equal(view.getByLabelText("Edited Event Hall").textContent, "1");
  assert.equal(view.getByLabelText("Event Hall open count").textContent, "3");
});

test("Hall and Booth rows remain non-interactive without a row callback", () => {
  const hall: HallApiData = {
    id: 1,
    number: "H1",
    area: 100,
    type: "Main",
    svg_id: "hall-1",
  };
  const booth: BoothApiData = {
    id: 1,
    number: "B1",
    qr_token: "booth-token",
    area: 10,
    price: "100.00",
    svg_id: "booth-1",
    created_at: "2026-07-20T00:00:00Z",
    is_booked: false,
  };
  const columns = [
    { key: "number", label: "Number", render: (item: HallApiData | BoothApiData) => item.number },
  ];
  const view = render(
    <>
      <DataTable columns={columns} getItemKey={(item) => item.id} items={[hall]} />
      <DataTable columns={columns} getItemKey={(item) => item.id} items={[booth]} />
    </>,
  );
  const rows = view.container.querySelectorAll(".data-table__row");

  assert.equal(rows.length, 2);
  assert.equal(rows[0].getAttribute("role"), null);
  assert.equal(rows[1].getAttribute("role"), null);
  assert.equal(rows[0].classList.contains("data-table__row--interactive"), false);
  assert.equal(rows[1].classList.contains("data-table__row--interactive"), false);
});
