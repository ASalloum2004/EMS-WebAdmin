import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { useBoothRequestActions } from "../src/features/order/hooks/useBoothRequestActions.js";
import type { BoothRequestActionResponse } from "../src/features/order/types.js";

const rejectSuccessResponse: BoothRequestActionResponse = {
  status: true,
  message: "request rejected successfully",
  data: null,
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

function getRejectResponse() {
  return new Response(JSON.stringify(rejectSuccessResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function BoothRequestActionsHarness({
  onRejectSuccess,
}: {
  onRejectSuccess?: () => Promise<unknown> | unknown;
}) {
  const actions = useBoothRequestActions({
    onRejectSuccess,
    rejectFallbackMessage: "Localized rejection failure.",
  });

  return (
    <div>
      <button
        onClick={() => void actions.rejectBoothRequestById(902)}
        type="button"
      >
        Reject
      </button>
      <button onClick={actions.clearRejectError} type="button">
        Clear error
      </button>
      <output aria-label="Reject state">
        {actions.isRejecting ? "rejecting" : "idle"}
      </output>
      {actions.rejectError ? <p role="alert">{actions.rejectError}</p> : null}
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
          ? JSON.stringify({ token: "actions-hook-test-token" })
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

test("Reject actions call the API once and run success orchestration once", async () => {
  const requestDeferred = createDeferred<Response>();
  const successDeferred = createDeferred<void>();
  const requestedPaths: string[] = [];
  const requestMethods: string[] = [];
  let successCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requestedPaths.push(url.pathname);
    requestMethods.push(init?.method ?? "");
    return requestDeferred.promise;
  };

  const view = render(
    <BoothRequestActionsHarness
      onRejectSuccess={() => {
        successCalls += 1;
        return successDeferred.promise;
      }}
    />,
  );
  const rejectButton = view.getByRole("button", { name: "Reject" });

  fireEvent.click(rejectButton);
  fireEvent.click(rejectButton);

  assert.equal(view.getByLabelText("Reject state").textContent, "rejecting");
  assert.deepEqual(requestedPaths, [
    "/api/v1/admin/booths/requests/reject/902",
  ]);
  assert.deepEqual(requestMethods, ["PATCH"]);

  await act(async () => {
    requestDeferred.resolve(getRejectResponse());
    await requestDeferred.promise;
  });

  await waitFor(() => assert.equal(successCalls, 1));
  assert.equal(view.getByLabelText("Reject state").textContent, "rejecting");

  await act(async () => {
    successDeferred.resolve();
    await successDeferred.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Reject state").textContent, "idle"),
  );
  assert.equal(successCalls, 1);
});

test("Reject actions expose API errors and clear them without success orchestration", async () => {
  let successCalls = 0;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "Request is already rejected." }), {
      status: 409,
      headers: { "Content-Type": "application/json" },
    });
  const view = render(
    <BoothRequestActionsHarness
      onRejectSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.equal(
    (await view.findByRole("alert")).textContent,
    "Request is already rejected.",
  );
  assert.equal(view.getByLabelText("Reject state").textContent, "idle");
  assert.equal(successCalls, 0);

  fireEvent.click(view.getByRole("button", { name: "Clear error" }));
  assert.equal(view.queryByRole("alert"), null);
});

test("Reject actions skip state and success work after unmount", async () => {
  const requestDeferred = createDeferred<Response>();
  let successCalls = 0;
  globalThis.fetch = async () => requestDeferred.promise;
  const view = render(
    <BoothRequestActionsHarness
      onRejectSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.equal(view.getByLabelText("Reject state").textContent, "rejecting");
  view.unmount();

  await act(async () => {
    requestDeferred.resolve(getRejectResponse());
    await requestDeferred.promise;
    await Promise.resolve();
  });

  assert.equal(successCalls, 0);
});
