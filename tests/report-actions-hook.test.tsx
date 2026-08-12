import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { useReportActions } from "../src/features/reports/hooks/useReportActions.js";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function ActionsHarness({ onSuccess }: { onSuccess: () => void }) {
  const actions = useReportActions({
    onActionSuccess: onSuccess,
    rejectFallbackMessage: "Localized rejection failure.",
    resolveFallbackMessage: "Localized approval failure.",
  });

  return (
    <div>
      <button
        onClick={() =>
          void actions.resolveReportById(7, { notes: "Approve notes" })
        }
        type="button"
      >
        Resolve
      </button>
      <button
        onClick={() =>
          void actions.rejectReportById(7, { notes: "Reject notes" })
        }
        type="button"
      >
        Reject
      </button>
      <button onClick={actions.clearRejectError} type="button">
        Clear rejection
      </button>
      <output aria-label="Resolve state">
        {actions.isResolving ? "resolving" : "idle"}
      </output>
      <output aria-label="Reject state">
        {actions.isRejecting ? "rejecting" : "idle"}
      </output>
      {actions.rejectError ? (
        <p aria-label="Reject error">{actions.rejectError}</p>
      ) : null}
      {actions.rejectFieldErrors.notes ? (
        <p aria-label="Notes error">{actions.rejectFieldErrors.notes}</p>
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
          ? JSON.stringify({ token: "report-actions-hook-token" })
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

test("Resolve prevents duplicate and simultaneous Report mutations", async () => {
  const request = createDeferred<Response>();
  const requestedPaths: string[] = [];
  let successCount = 0;
  globalThis.fetch = async (input) => {
    requestedPaths.push(new URL(getRequestedUrl(input)).pathname);
    return request.promise;
  };
  const view = render(
    <ActionsHarness
      onSuccess={() => {
        successCount += 1;
      }}
    />,
  );

  const resolveButton = view.getByRole("button", { name: "Resolve" });
  fireEvent.click(resolveButton);
  fireEvent.click(resolveButton);
  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.equal(view.getByLabelText("Resolve state").textContent, "resolving");
  assert.equal(view.getByLabelText("Reject state").textContent, "idle");
  assert.deepEqual(requestedPaths, [
    "/api/v1/admin/reports/7/resolved",
  ]);

  await act(async () => {
    request.resolve(
      new Response("{}", {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    await request.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Resolve state").textContent, "idle"),
  );
  assert.equal(successCount, 1);
  assert.equal(requestedPaths.length, 1);
});

test("Reject exposes and clears backend messages and notes validation", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        errors: { notes: ["Notes are not valid for this action."] },
        message: "Report validation failed.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 422,
      },
    );
  const view = render(<ActionsHarness onSuccess={() => undefined} />);

  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.equal(
    (await view.findByLabelText("Reject error")).textContent,
    "Report validation failed.",
  );
  assert.equal(
    view.getByLabelText("Notes error").textContent,
    "Notes are not valid for this action.",
  );

  fireEvent.click(view.getByRole("button", { name: "Clear rejection" }));
  assert.equal(view.queryByLabelText("Reject error"), null);
  assert.equal(view.queryByLabelText("Notes error"), null);
});
