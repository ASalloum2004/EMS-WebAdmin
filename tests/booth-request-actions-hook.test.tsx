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

const approveSuccessResponse = {
  status: true as const,
  message: "request approved successfully",
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

function getApproveResponse() {
  return new Response(JSON.stringify(approveSuccessResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function getApproveConflictResponse({
  currentPage = 1,
  lastPage = 2,
  requestId = 5,
  total = 4,
}: {
  currentPage?: number;
  lastPage?: number;
  requestId?: number;
  total?: number;
} = {}) {
  return new Response(
    JSON.stringify({
      status: false,
      message: "Conflicting requests retrieved",
      errors: {
        data: {
          data: [
            {
              id: requestId,
              booth_id: 8,
              company_id: 2,
              status: "pending",
              final_price: 160,
            },
          ],
          meta: {
            current_page: currentPage,
            per_page: 3,
            total,
            last_page: lastPage,
          },
        },
      },
    }),
    {
      status: 409,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function BoothRequestActionsHarness({
  onApproveSuccess,
  onRejectSuccess,
}: {
  onApproveSuccess?: () => Promise<unknown> | unknown;
  onRejectSuccess?: () => Promise<unknown> | unknown;
}) {
  const actions = useBoothRequestActions({
    approveConflictFallbackMessage: "Localized conflict loading failure.",
    approveFallbackMessage: "Localized approval failure.",
    onApproveSuccess,
    onRejectSuccess,
    rejectFallbackMessage: "Localized rejection failure.",
  });

  return (
    <div>
      <button
        onClick={() => void actions.approveBoothRequestById(902)}
        type="button"
      >
        Approve
      </button>
      <button
        onClick={() => void actions.rejectBoothRequestById(902)}
        type="button"
      >
        Reject
      </button>
      <button onClick={actions.clearRejectError} type="button">
        Clear Reject error
      </button>
      <button onClick={actions.clearApproveError} type="button">
        Clear Approve error
      </button>
      <button
        onClick={() => void actions.approveBoothRequestAnyway()}
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
      <button onClick={actions.closeApproveConflict} type="button">
        Close conflict
      </button>
      <output aria-label="Approve state">
        {actions.isApproving ? "approving" : "idle"}
      </output>
      <output aria-label="Reject state">
        {actions.isRejecting ? "rejecting" : "idle"}
      </output>
      <output aria-label="Conflict page state">
        {actions.isLoadingApproveConflicts ? "loading" : "idle"}
      </output>
      {actions.approveConflict ? (
        <output aria-label="Approve conflict">
          {`${actions.approveConflict.meta.current_page}:${actions.approveConflict.meta.total}:${actions.approveConflict.requests[0]?.id ?? "missing"}`}
        </output>
      ) : null}
      {actions.approveConflictError ? (
        <p aria-label="Approve conflict error" role="alert">
          {actions.approveConflictError}
        </p>
      ) : null}
      {actions.approveError ? (
        <p aria-label="Approve error" role="alert">
          {actions.approveError}
        </p>
      ) : null}
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

  fireEvent.click(view.getByRole("button", { name: "Clear Reject error" }));
  assert.equal(view.queryByRole("alert"), null);
});

test("Approve actions call the API once, use force false, and run success once", async () => {
  const requestDeferred = createDeferred<Response>();
  const successDeferred = createDeferred<void>();
  const requests: Array<{ body: string; method: string; path: string }> = [];
  let successCalls = 0;

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
    return requestDeferred.promise;
  };

  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        successCalls += 1;
        return successDeferred.promise;
      }}
    />,
  );
  const approveButton = view.getByRole("button", { name: "Approve" });

  fireEvent.click(approveButton);
  fireEvent.click(approveButton);

  assert.equal(view.getByLabelText("Approve state").textContent, "approving");
  assert.deepEqual(requests, [
    {
      body: JSON.stringify({ force: false }),
      method: "POST",
      path: "/api/v1/admin/booths/requests/approve/902",
    },
  ]);

  await act(async () => {
    requestDeferred.resolve(getApproveResponse());
    await requestDeferred.promise;
  });

  await waitFor(() => assert.equal(successCalls, 1));
  assert.equal(view.getByLabelText("Approve state").textContent, "approving");

  await act(async () => {
    successDeferred.resolve();
    await successDeferred.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Approve state").textContent, "idle"),
  );
  assert.equal(successCalls, 1);
});

test("Approve errors use backend messages, clear, and skip success", async () => {
  let successCalls = 0;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        status: false,
        message: "Booth is no longer available.",
        data: null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Approve" }));

  assert.equal(
    (await view.findByLabelText("Approve error")).textContent,
    "Booth is no longer available.",
  );
  assert.equal(view.getByLabelText("Approve state").textContent, "idle");
  assert.equal(successCalls, 0);

  fireEvent.click(
    view.getByRole("button", { name: "Clear Approve error" }),
  );
  assert.equal(view.queryByLabelText("Approve error"), null);
});

test("Approve conflicts do not run the statistics refresh callback", async () => {
  let statisticsRefreshes = 0;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        message: "Booth approval conflicts with another request.",
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      },
    );
  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        statisticsRefreshes += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Approve" }));

  assert.equal(
    (await view.findByLabelText("Approve error")).textContent,
    "Booth approval conflicts with another request.",
  );
  assert.equal(statisticsRefreshes, 0);
  assert.equal(view.getByLabelText("Approve state").textContent, "idle");
});

test("valid Approve conflicts populate conflict state without a generic error", async () => {
  let successCalls = 0;
  globalThis.fetch = async () => getApproveConflictResponse();
  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Approve" }));

  assert.equal(
    (await view.findByLabelText("Approve conflict")).textContent,
    "1:4:5",
  );
  assert.equal(view.queryByLabelText("Approve error"), null);
  assert.equal(successCalls, 0);
});

test("forced Approve runs exactly once and invokes success once", async () => {
  const forceRequest = createDeferred<Response>();
  const requests: Array<{ body: string; page: string | null }> = [];
  let successCalls = 0;

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
      page: url.searchParams.get("page"),
    });

    return requests.length === 1
      ? getApproveConflictResponse()
      : forceRequest.promise;
  };
  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  await view.findByLabelText("Approve conflict");

  const approveAnywayButton = view.getByRole("button", {
    name: "Approve Anyway",
  });
  fireEvent.click(approveAnywayButton);
  fireEvent.click(approveAnywayButton);

  assert.equal(view.getByLabelText("Approve state").textContent, "approving");
  assert.equal(requests.length, 2);
  assert.deepEqual(requests.map(({ body }) => JSON.parse(body)), [
    { force: false },
    { force: true },
  ]);
  assert.deepEqual(requests.map(({ page }) => page), [null, null]);

  await act(async () => {
    forceRequest.resolve(getApproveResponse());
    await forceRequest.promise;
  });

  await waitFor(() =>
    assert.equal(view.getByLabelText("Approve state").textContent, "idle"),
  );
  assert.equal(successCalls, 1);
  assert.equal(view.queryByLabelText("Approve conflict"), null);
});

test("failed forced Approve keeps conflict state and exposes the error", async () => {
  let requestCount = 0;
  let successCalls = 0;
  globalThis.fetch = async () => {
    requestCount += 1;

    return requestCount === 1
      ? getApproveConflictResponse()
      : new Response(
          JSON.stringify({ message: "Forced approval was not completed." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
  };
  const view = render(
    <BoothRequestActionsHarness
      onApproveSuccess={() => {
        successCalls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  await view.findByLabelText("Approve conflict");
  fireEvent.click(view.getByRole("button", { name: "Approve Anyway" }));

  assert.equal(
    (await view.findByLabelText("Approve conflict error")).textContent,
    "Forced approval was not completed.",
  );
  assert.equal(view.getByLabelText("Approve conflict").textContent, "1:4:5");
  assert.equal(view.getByLabelText("Approve state").textContent, "idle");
  assert.equal(successCalls, 0);
});

test("conflict pagination keeps current data while loading and requests the selected page", async () => {
  const pageRequest = createDeferred<Response>();
  const requestedPages: Array<string | null> = [];
  globalThis.fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requestedPages.push(url.searchParams.get("page"));

    return requestedPages.length === 1
      ? getApproveConflictResponse()
      : pageRequest.promise;
  };
  const view = render(<BoothRequestActionsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  await view.findByLabelText("Approve conflict");
  fireEvent.click(view.getByRole("button", { name: "Conflict page 2" }));

  assert.deepEqual(requestedPages, [null, "2"]);
  assert.equal(
    view.getByLabelText("Conflict page state").textContent,
    "loading",
  );
  assert.equal(view.getByLabelText("Approve conflict").textContent, "1:4:5");

  await act(async () => {
    pageRequest.resolve(
      getApproveConflictResponse({ currentPage: 2, requestId: 8 }),
    );
    await pageRequest.promise;
  });

  await waitFor(() =>
    assert.equal(
      view.getByLabelText("Conflict page state").textContent,
      "idle",
    ),
  );
  assert.equal(view.getByLabelText("Approve conflict").textContent, "2:4:8");
});

test("Approve and Reject cannot run at the same time", async () => {
  const requestDeferred = createDeferred<Response>();
  const requestedPaths: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    requestedPaths.push(url.pathname);
    return requestDeferred.promise;
  };
  const view = render(<BoothRequestActionsHarness />);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.deepEqual(requestedPaths, [
    "/api/v1/admin/booths/requests/approve/902",
  ]);
  assert.equal(view.getByLabelText("Approve state").textContent, "approving");
  assert.equal(view.getByLabelText("Reject state").textContent, "idle");

  await act(async () => {
    requestDeferred.resolve(getApproveResponse());
    await requestDeferred.promise;
  });
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
