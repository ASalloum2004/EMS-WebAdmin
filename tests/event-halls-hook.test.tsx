import "./setup-dom.js";
import assert from "node:assert/strict";
import { StrictMode } from "react";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { DataTable } from "../src/components/DataTable/DataTable.js";
import { ManagementBoothFiltersPanel } from "../src/features/management/components/ManagementBoothFiltersPanel/ManagementBoothFiltersPanel.js";
import {
  isValidEventHallPrice,
  ManagementEventHallEditModal,
} from "../src/features/management/components/ManagementEventHallEditModal/ManagementEventHallEditModal.js";
import {
  getEventHallActions,
  getEventHallColumns,
} from "../src/features/management/components/tableColumns.js";
import { useEventHallEditing } from "../src/features/management/hooks/useEventHallEditing.js";
import { useEventHalls } from "../src/features/management/hooks/useEventHalls.js";
import type { EventHall } from "../src/features/management/types.js";
import {
  I18nProvider,
  useI18n,
} from "../src/i18n/I18nContext.js";

const eventHalls: EventHall[] = [
  { id: 1, number: "1", area: 100, price_per_hour: "50000.00" },
  { id: 2, number: "2", area: 150, price_per_hour: "75000.00" },
];

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function getEventHallsResponse(data: EventHall[]) {
  return new Response(
    JSON.stringify({ status: true, message: "Success", data }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function getEventHallUpdateResponse(data: EventHall | null) {
  return new Response(
    JSON.stringify({ status: true, message: "Success", data }),
    {
      status: 200,
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

function EventHallsHarness({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const eventHallsState = useEventHalls({
    enabled,
    errorFallback: t.management.eventHalls.errorFallback,
    updateErrorFallback: t.management.eventHalls.updateErrorFallback,
    validationMessages: t.management.validation,
  });
  const eventHallEditing = useEventHallEditing({
    clearUpdateError: eventHallsState.clearUpdateError,
    updateEventHallPriceById: eventHallsState.updateEventHallPriceById,
  });

  return (
    <div>
      <button
        onClick={eventHallsState.toggleFilterPanel}
        type="button"
      >
        Toggle Event Hall Filters
      </button>
      <button
        onClick={() =>
          eventHallsState.setDraftFilters({
            ...eventHallsState.draftFilters,
            minArea: "invalid",
          })
        }
        type="button"
      >
        Set Invalid Event Hall Filter
      </button>
      <button
        onClick={() => void eventHallsState.refetch()}
        type="button"
      >
        Retry Event Halls
      </button>

      <output aria-label="Event Halls loading">
        {eventHallsState.isLoading ? "loading" : "idle"}
      </output>
      <output aria-label="Event Halls values">
        {JSON.stringify(eventHallsState.eventHalls)}
      </output>
      <output aria-label="Event Hall update state">
        {eventHallsState.isUpdating ? "updating" : "idle"}
      </output>

      {eventHallsState.isFilterPanelOpen ? (
        <ManagementBoothFiltersPanel
          filters={eventHallsState.draftFilters}
          mode="eventHall"
          onApply={eventHallsState.applyFilters}
          onChange={eventHallsState.setDraftFilters}
          onClear={eventHallsState.clearFilters}
          validationMessage={eventHallsState.validationMessage}
        />
      ) : null}

      {eventHallsState.error ? (
        <p role="alert">{eventHallsState.error}</p>
      ) : null}

      {!eventHallsState.isLoading && !eventHallsState.error ? (
        <DataTable
          actions={getEventHallActions(
            eventHallEditing.openEditModal,
            t.common.edit,
          )}
          ariaLabel={t.management.eventHalls.ariaLabel}
          columns={getEventHallColumns(t)}
          emptyMessage={t.management.eventHalls.empty}
          getItemKey={(eventHall) => eventHall.id}
          items={eventHallsState.eventHalls}
        />
      ) : null}

      {eventHallEditing.selectedEventHall ? (
        <ManagementEventHallEditModal
          error={eventHallsState.updateError}
          eventHall={eventHallEditing.selectedEventHall}
          isSubmitting={eventHallsState.isUpdating}
          onCancel={eventHallEditing.closeEditModal}
          onSave={eventHallEditing.saveEventHallPrice}
        />
      ) : null}
    </div>
  );
}

function renderEventHallsHarness(enabled: boolean, strictMode = false) {
  const content = (
    <I18nProvider>
      <EventHallsHarness enabled={enabled} />
    </I18nProvider>
  );

  return render(strictMode ? <StrictMode>{content}</StrictMode> : content);
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
          ? JSON.stringify({ token: "event-halls-hook-test-token" })
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

test("does not request Event Halls until enabled", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(false);

  await act(async () => undefined);
  assert.equal(requestCount, 0);

  view.rerender(
    <I18nProvider>
      <EventHallsHarness enabled />
    </I18nProvider>,
  );

  await waitFor(() => assert.equal(requestCount, 1));
  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
});

test("exposes loading and successful Event Hall data", async () => {
  const request = createDeferred<Response>();
  globalThis.fetch = async () => request.promise;
  const view = renderEventHallsHarness(true);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls loading").textContent,
      "loading",
    ),
  );

  await act(async () => {
    request.resolve(getEventHallsResponse(eventHalls));
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(
    view.getByLabelText("Event Halls loading").textContent,
    "idle",
  );
});

test("opening and closing filters does not request, while Apply requests once", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));

  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });
  fireEvent.click(toggleButton);
  assert.equal(requestedUrls.length, 1);
  fireEvent.click(toggleButton);
  assert.equal(requestedUrls.length, 1);
  fireEvent.click(toggleButton);

  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() => assert.equal(requestedUrls.length, 2));
  const appliedUrl = new URL(requestedUrls[1]);
  assert.equal(appliedUrl.searchParams.get("filter[min_area]"), "100");
  assert.equal(Array.from(appliedUrl.searchParams).length, 1);
  assert.equal(view.queryByRole("dialog"), null);
});

test("invalid numeric filters do not trigger a request", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.click(
    view.getByRole("button", { name: "Set Invalid Event Hall Filter" }),
  );

  assert.equal(
    view.getByRole("alert").textContent,
    "Enter a valid minimum area.",
  );
  const applyButton = view.getByRole("button", {
    name: "Apply",
  }) as HTMLButtonElement;
  assert.equal(applyButton.disabled, true);
  fireEvent.click(applyButton);
  await act(async () => undefined);
  assert.equal(requestCount, 1);
});

test("Clear requests the complete unfiltered Event Hall list", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);
  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));

  fireEvent.click(toggleButton);
  fireEvent.click(view.getByRole("button", { name: "Clear" }));

  await waitFor(() => assert.equal(requestedUrls.length, 3));
  assert.equal(new URL(requestedUrls[2]).search, "");
  assert.equal(
    (view.getByLabelText("Minimum area") as HTMLInputElement).value,
    "",
  );
});

test("Retry preserves the currently applied backend filters", async () => {
  const requestedUrls: string[] = [];
  globalThis.fetch = async (input) => {
    requestedUrls.push(getRequestUrl(input));

    if (requestedUrls.length === 2) {
      return new Response(
        JSON.stringify({ message: "Filtered Event Halls unavailable." }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.equal(
      view.getByRole("alert").textContent,
      "Filtered Event Halls unavailable.",
    ),
  );
  fireEvent.click(view.getByRole("button", { name: "Retry Event Halls" }));

  await waitFor(() => assert.equal(requestedUrls.length, 3));
  assert.equal(
    new URL(requestedUrls[1]).searchParams.get("filter[min_area]"),
    "100",
  );
  assert.equal(
    new URL(requestedUrls[2]).searchParams.get("filter[min_area]"),
    "100",
  );
});

test("a filtered empty response displays the translated empty state", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(requestCount === 1 ? eventHalls : []);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.change(view.getByLabelText("Minimum Price"), {
    target: { value: "100000" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));

  await waitFor(() =>
    assert.equal(
      view.getByText("No event halls found.").textContent,
      "No event halls found.",
    ),
  );
});

test("validates Event Hall prices, including zero and non-finite values", () => {
  assert.equal(isValidEventHallPrice(""), false);
  assert.equal(isValidEventHallPrice("not-a-number"), false);
  assert.equal(isValidEventHallPrice("NaN"), false);
  assert.equal(isValidEventHallPrice("Infinity"), false);
  assert.equal(isValidEventHallPrice("-0.01"), false);
  assert.equal(isValidEventHallPrice("0"), true);
  assert.equal(isValidEventHallPrice("75000.25"), true);
});

test("adds an Edit action to every Event Hall and validates the selected price", async () => {
  globalThis.fetch = async () => getEventHallsResponse(eventHalls);
  const view = renderEventHallsHarness(true);

  await waitFor(() =>
    assert.equal(view.getAllByRole("button", { name: "Edit" }).length, 2),
  );
  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[1]);

  const dialog = view.getByRole("dialog");
  assert.match(dialog.textContent ?? "", /#2/);
  const priceInput = view.getByLabelText(
    "Price Per Hour",
  ) as HTMLInputElement;
  assert.equal(priceInput.value, "75000.00");

  fireEvent.change(priceInput, { target: { value: "" } });
  assert.equal(
    view.getByRole("alert").textContent,
    "Event Hall price must be a valid number greater than or equal to 0.",
  );
  assert.equal(
    (view.getByRole("button", { name: "Save" }) as HTMLButtonElement)
      .disabled,
    true,
  );

  fireEvent.change(priceInput, { target: { value: "-1" } });
  assert.equal(
    (view.getByRole("button", { name: "Save" }) as HTMLButtonElement)
      .disabled,
    true,
  );
});

test("updates only the matching Event Hall row and closes after success", async () => {
  const patchRequest = createDeferred<Response>();
  const updatedEventHall: EventHall = {
    ...eventHalls[0],
    price_per_hour: "0.00",
  };
  let patchBody = "";

  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") {
      patchBody = String(init.body ?? "");
      return patchRequest.promise;
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() =>
    assert.equal(view.getAllByRole("button", { name: "Edit" }).length, 2),
  );
  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[0]);
  fireEvent.change(view.getByLabelText("Price Per Hour"), {
    target: { value: "0" },
  });
  fireEvent.click(view.getByRole("button", { name: "Save" }));

  await act(async () => {
    patchRequest.resolve(getEventHallUpdateResponse(updatedEventHall));
    await patchRequest.promise;
  });

  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.deepEqual(JSON.parse(patchBody), { price_per_hour: 0 });
  assert.equal(
    view.getByLabelText("Event Halls values").textContent,
    JSON.stringify([updatedEventHall, eventHalls[1]]),
  );
  assert.equal(
    view.getByLabelText("Event Hall update state").textContent,
    "idle",
  );
  assert.ok(view.getByText("0.00"));
});

test("preserves rows, exposes backend errors, and keeps the modal open after failure", async () => {
  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") {
      return new Response(
        JSON.stringify({
          status: false,
          message: "The price per hour must be at least 0.",
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() =>
    assert.equal(view.getAllByRole("button", { name: "Edit" }).length, 2),
  );
  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[0]);
  fireEvent.change(view.getByLabelText("Price Per Hour"), {
    target: { value: "80000" },
  });
  fireEvent.click(view.getByRole("button", { name: "Save" }));

  await waitFor(() =>
    assert.equal(
      view.getByRole("alert").textContent,
      "The price per hour must be at least 0.",
    ),
  );
  assert.ok(view.getByRole("dialog"));
  assert.equal(
    view.getByLabelText("Event Halls values").textContent,
    JSON.stringify(eventHalls),
  );
  assert.equal(
    view.getByLabelText("Event Hall update state").textContent,
    "idle",
  );
});

test("prevents duplicate Event Hall price submissions", async () => {
  const patchRequest = createDeferred<Response>();
  const updatedEventHall: EventHall = {
    ...eventHalls[0],
    price_per_hour: "80000.00",
  };
  let patchCount = 0;

  globalThis.fetch = async (_input, init) => {
    if (init?.method === "PATCH") {
      patchCount += 1;
      return patchRequest.promise;
    }

    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() =>
    assert.equal(view.getAllByRole("button", { name: "Edit" }).length, 2),
  );
  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[0]);
  fireEvent.change(view.getByLabelText("Price Per Hour"), {
    target: { value: "80000" },
  });
  const dialog = view.getByRole("dialog");
  fireEvent.submit(dialog);
  fireEvent.submit(dialog);

  await waitFor(() => assert.equal(patchCount, 1));
  assert.equal(
    view.getByLabelText("Event Hall update state").textContent,
    "updating",
  );

  await act(async () => {
    patchRequest.resolve(
      new Response(
        JSON.stringify({
          status: true,
          message: "Success",
          data: updatedEventHall,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    await patchRequest.promise;
  });

  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(
    view.getByLabelText("Event Hall update state").textContent,
    "idle",
  );
});

test("refetches with applied filters when PATCH has no usable Event Hall data", async () => {
  const requestedUrls: string[] = [];
  const requestedMethods: string[] = [];
  const updatedEventHall: EventHall = {
    ...eventHalls[0],
    price_per_hour: "90000.00",
  };

  globalThis.fetch = async (input, init) => {
    requestedUrls.push(getRequestUrl(input));
    requestedMethods.push(init?.method ?? "GET");

    if (init?.method === "PATCH") {
      return getEventHallUpdateResponse(null);
    }

    return getEventHallsResponse(
      requestedUrls.length === 4 ? [updatedEventHall] : eventHalls,
    );
  };
  const view = renderEventHallsHarness(true);

  await waitFor(() => assert.equal(requestedUrls.length, 1));
  fireEvent.click(
    view.getByRole("button", { name: "Toggle Event Hall Filters" }),
  );
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestedUrls.length, 2));

  fireEvent.click(view.getAllByRole("button", { name: "Edit" })[0]);
  fireEvent.change(view.getByLabelText("Price Per Hour"), {
    target: { value: "90000" },
  });
  fireEvent.click(view.getByRole("button", { name: "Save" }));

  await waitFor(() => assert.equal(requestedUrls.length, 4));
  assert.deepEqual(requestedMethods, ["GET", "GET", "PATCH", "GET"]);
  assert.equal(
    new URL(requestedUrls[3]).searchParams.get("filter[min_area]"),
    "100",
  );
  await waitFor(() => assert.equal(view.queryByRole("dialog"), null));
  assert.equal(
    view.getByLabelText("Event Halls values").textContent,
    JSON.stringify([updatedEventHall]),
  );
});

test("an older response cannot overwrite a newer filtered response", async () => {
  const olderRequest = createDeferred<Response>();
  const newerRequest = createDeferred<Response>();
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return getEventHallsResponse(eventHalls);
    }

    return requestCount === 2 ? olderRequest.promise : newerRequest.promise;
  };
  const view = renderEventHallsHarness(true);
  const toggleButton = view.getByRole("button", {
    name: "Toggle Event Hall Filters",
  });

  await waitFor(() => assert.equal(requestCount, 1));
  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "100" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestCount, 2));

  fireEvent.click(toggleButton);
  fireEvent.change(view.getByLabelText("Minimum area"), {
    target: { value: "200" },
  });
  fireEvent.click(view.getByRole("button", { name: "Apply" }));
  await waitFor(() => assert.equal(requestCount, 3));

  const newerEventHalls = [eventHalls[1]];
  await act(async () => {
    newerRequest.resolve(getEventHallsResponse(newerEventHalls));
    await newerRequest.promise;
  });
  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(newerEventHalls),
    ),
  );

  await act(async () => {
    olderRequest.resolve(getEventHallsResponse([eventHalls[0]]));
    await olderRequest.promise;
    await Promise.resolve();
  });
  assert.equal(
    view.getByLabelText("Event Halls values").textContent,
    JSON.stringify(newerEventHalls),
  );
});

test("avoids duplicate initial Event Hall requests in Strict Mode", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return getEventHallsResponse(eventHalls);
  };
  const view = renderEventHallsHarness(true, true);

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Event Halls values").textContent,
      JSON.stringify(eventHalls),
    ),
  );
  assert.equal(requestCount, 1);
});
