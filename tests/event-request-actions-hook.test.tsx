import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useEventRequestActions } from "../src/features/order/hooks/useEventRequestActions/index.js";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getSuccessResponse() {
  return jsonResponse({ status: true, message: "Success", data: null });
}

function getConflictResponse({
  currentPage = 1,
  requestId = 9,
}: {
  currentPage?: number;
  requestId?: number;
} = {}) {
  return jsonResponse(
    {
      status: false,
      message: null,
      errors: {
        data: {
          data: [
            {
              id: requestId,
              title: `Conflict ${requestId}`,
              event_hall_id: 3,
              type: "conference",
              status: "pending",
              start_at: "2026-08-12T10:00:00.000000Z",
              end_at: "2026-08-12T12:00:00.000000Z",
              duration: 2,
              eventable: { id: 1, name: "Dar Al feker" },
              created_at: "2026-07-21T14:05:08.000000Z",
            },
          ],
          meta: {
            current_page: currentPage,
            per_page: 3,
            total: 4,
            last_page: 2,
          },
        },
      },
    },
    409,
  );
}

function EventRequestActionsHarness({
  onApproveSuccess,
  onInvalidStatus,
  onRejectSuccess,
}: {
  onApproveSuccess?: () => Promise<unknown> | unknown;
  onInvalidStatus?: () => Promise<unknown> | unknown;
  onRejectSuccess?: () => Promise<unknown> | unknown;
}) {
  const actions = useEventRequestActions({
    approveConflictFallbackMessage: "Localized conflict failure.",
    approveFallbackMessage: "Localized approve failure.",
    invalidStatusMessage: "Localized invalid status.",
    onApproveSuccess,
    onInvalidStatus,
    onRejectSuccess,
    rejectFallbackMessage: "Localized reject failure.",
    selectedRequestId: 902,
    selectedRequestStatus: "pending",
  });

  const clearForDetailsClose = () => {
    actions.clearApproveError();
    actions.clearRejectError();
    actions.closeApproveConflict();
  };

  return (
    <div>
      <button
        onClick={() => void actions.approveEventRequestById(902)}
        type="button"
      >
        Approve
      </button>
      <button
        onClick={() => void actions.rejectEventRequestById(902)}
        type="button"
      >
        Reject
      </button>
      <button
        onClick={() => void actions.approveEventRequestAnyway()}
        type="button"
      >
        Approve Anyway
      </button>
      <button
        onClick={() => void actions.loadApproveConflictPage(2)}
        type="button"
      >
        Conflict page 2
      </button>
      <button onClick={clearForDetailsClose} type="button">
        Close details
      </button>
      <output aria-label="Approve state">
        {actions.isApproving ? "approving" : "idle"}
      </output>
      <output aria-label="Reject state">
        {actions.isRejecting ? "rejecting" : "idle"}
      </output>
      <output aria-label="Conflict loading state">
        {actions.isLoadingApproveConflicts ? "loading" : "idle"}
      </output>
      {actions.approveConflict ? (
        <output aria-label="Conflict state">
          {`${actions.approveConflict.message ?? "null"}:${actions.approveConflict.meta.current_page}:${actions.approveConflict.requests[0]?.id}`}
        </output>
      ) : null}
      {actions.approveError ? (
        <p aria-label="Approve error" role="alert">
          {actions.approveError}
        </p>
      ) : null}
      {actions.rejectError ? (
        <p aria-label="Reject error" role="alert">
          {actions.rejectError}
        </p>
      ) : null}
    </div>
  );
}

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
        key === "auth_session"
          ? JSON.stringify({ token: "event-hook-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
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

test("normal Approve prevents duplicates, sends force false, and refreshes once", async () => {
  const request = createDeferred<Response>();
  const requests: Array<{ body: string; method: string; path: string }> = [];
  let refreshes = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requests.push({
      body: String(init?.body),
      method: init?.method ?? "",
      path: url.pathname,
    });
    return request.promise;
  };
  const view = render(
    <EventRequestActionsHarness
      onApproveSuccess={() => {
        refreshes += 1;
      }}
    />,
  );
  const approve = view.getByRole("button", { name: "Approve" });

  fireEvent.click(approve);
  fireEvent.click(approve);

  assert.equal(view.getByLabelText("Approve state").textContent, "approving");
  assert.deepEqual(requests, [
    {
      body: JSON.stringify({ force: false }),
      method: "POST",
      path: "/api/v1/admin/events/requests/902/approve",
    },
  ]);

  await act(async () => {
    request.resolve(getSuccessResponse());
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Approve state").textContent, "idle"),
  );
  assert.equal(refreshes, 1);
});

test("Reject prevents duplicates and invokes its success refresh once", async () => {
  const request = createDeferred<Response>();
  const methods: string[] = [];
  const bodies: Array<BodyInit | null | undefined> = [];
  let refreshes = 0;

  globalThis.fetch = async (_input, init) => {
    methods.push(init?.method ?? "");
    bodies.push(init?.body);
    return request.promise;
  };
  const view = render(
    <EventRequestActionsHarness
      onRejectSuccess={() => {
        refreshes += 1;
      }}
    />,
  );
  const reject = view.getByRole("button", { name: "Reject" });

  fireEvent.click(reject);
  fireEvent.click(reject);
  assert.deepEqual(methods, ["PATCH"]);
  assert.deepEqual(bodies, [undefined]);

  await act(async () => {
    request.resolve(getSuccessResponse());
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Reject state").textContent, "idle"),
  );
  assert.equal(refreshes, 1);
});

test("conflict pages remain force false and Approve Anyway is the first force true request", async () => {
  const pageRequest = createDeferred<Response>();
  const forceRequest = createDeferred<Response>();
  const requests: Array<{ body: { force: boolean }; page: string | null }> = [];

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requests.push({
      body: JSON.parse(String(init?.body)) as { force: boolean },
      page: url.searchParams.get("page"),
    });

    if (requests.length === 1) {
      return getConflictResponse();
    }

    return requests.length === 2 ? pageRequest.promise : forceRequest.promise;
  };
  const view = render(<EventRequestActionsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  assert.equal(
    (await view.findByLabelText("Conflict state")).textContent,
    "null:1:9",
  );
  assert.deepEqual(requests, [{ body: { force: false }, page: null }]);

  fireEvent.click(view.getByRole("button", { name: "Conflict page 2" }));
  assert.equal(
    view.getByLabelText("Conflict loading state").textContent,
    "loading",
  );
  assert.deepEqual(requests[1], { body: { force: false }, page: "2" });

  await act(async () => {
    pageRequest.resolve(getConflictResponse({ currentPage: 2, requestId: 12 }));
    await pageRequest.promise;
  });
  await waitFor(() =>
    assert.equal(view.getByLabelText("Conflict state").textContent, "null:2:12"),
  );

  fireEvent.click(view.getByRole("button", { name: "Approve Anyway" }));
  fireEvent.click(view.getByRole("button", { name: "Approve Anyway" }));
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[2], { body: { force: true }, page: null });

  await act(async () => {
    forceRequest.resolve(getSuccessResponse());
    await forceRequest.promise;
  });
  await waitFor(() => assert.equal(view.queryByLabelText("Conflict state"), null));
});

test("event.invalid_status refreshes stale data and exposes the translated message", async () => {
  let invalidStatusRefreshes = 0;
  globalThis.fetch = async () =>
    jsonResponse(
      { status: false, message: "event.invalid_status", errors: null },
      400,
    );
  const view = render(
    <EventRequestActionsHarness
      onInvalidStatus={() => {
        invalidStatusRefreshes += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.equal(
    (await view.findByLabelText("Reject error")).textContent,
    "Localized invalid status.",
  );
  assert.equal(invalidStatusRefreshes, 1);
});

test("the Event details close handler clears action errors and conflict state", async () => {
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    return requestCount === 1
      ? jsonResponse({ message: "Approval failed." }, 500)
      : getConflictResponse();
  };
  const view = render(<EventRequestActionsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  assert.equal(
    (await view.findByLabelText("Approve error")).textContent,
    "Approval failed.",
  );
  fireEvent.click(view.getByRole("button", { name: "Close details" }));
  assert.equal(view.queryByLabelText("Approve error"), null);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  await view.findByLabelText("Conflict state");
  fireEvent.click(view.getByRole("button", { name: "Close details" }));
  assert.equal(view.queryByLabelText("Conflict state"), null);
});
