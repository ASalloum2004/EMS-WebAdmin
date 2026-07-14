import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { StrictMode, useState } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { DataTable, type DataTableColumn } from "../src/components/DataTable/DataTable.js";
import { BoothRequestDetailsModal } from "../src/features/order/components/BoothRequestDetailsModal/BoothRequestDetailsModal.js";
import { useBoothRequestDetails } from "../src/features/order/hooks/useBoothRequestDetails.js";
import type {
  BoothRequestApiData,
  BoothRequestDetailsApiData,
  BoothRequestDetailsResponse,
} from "../src/features/order/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const firstRequest: BoothRequestApiData = {
  booth_id: 9,
  company_id: 37,
  created_at: "2026-07-14 10:01:00",
  final_price: 10,
  id: 901,
  reason_for_booking: "List data must not populate the details modal.",
  status: "rejected",
};

const secondRequest: BoothRequestApiData = {
  booth_id: 12,
  company_id: 52,
  created_at: "2026-07-15 10:01:00",
  final_price: 20,
  id: 902,
  reason_for_booking: "Second list request.",
  status: "pending",
};

const firstDetails: BoothRequestDetailsApiData = {
  id: 901,
  booth_id: 1,
  company_id: 37,
  status: "approved",
  reason_for_booking: "Exhibitor booth request created for Dar Al feker.",
  final_price: 250,
  created_at: "2026-07-14 12:00:59",
  services: [],
  company: {
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
    logo: "",
    gallery: [],
  },
};

const secondDetails: BoothRequestDetailsApiData = {
  ...firstDetails,
  id: 902,
  booth_id: 12,
  company_id: 52,
  status: "pending",
  company: {
    ...firstDetails.company,
    id: 52,
    name: "Second Company",
    status: "approved",
  },
};

const columns: Array<DataTableColumn<BoothRequestApiData>> = [
  {
    key: "company_id",
    label: "Company ID",
    render: (request) => `Company #${request.company_id}`,
    variant: "primary",
  },
  {
    key: "booth_id",
    label: "Booth ID",
    render: (request) => `Booth #${request.booth_id}`,
    variant: "metric",
  },
];

function RequestDetailsHarness({
  requests = [firstRequest],
}: {
  requests?: BoothRequestApiData[];
}) {
  const [request, setRequest] = useState<BoothRequestApiData | null>(null);
  const requestDetails = useBoothRequestDetails(request?.id ?? null);

  return (
    <I18nProvider>
      <DataTable
        ariaLabel="Booth requests"
        columns={columns}
        getItemAriaLabel={(item) =>
          `View details for Company #${item.company_id}`
        }
        getItemKey={(item) => item.id}
        items={requests}
        onItemClick={setRequest}
      />
      {request ? (
        <BoothRequestDetailsModal
          details={requestDetails.details}
          error={requestDetails.error}
          isLoading={requestDetails.isLoading}
          onClose={() => setRequest(null)}
          onRetry={() => void requestDetails.refetch()}
        />
      ) : null}
    </I18nProvider>
  );
}

function getResponse(details: BoothRequestDetailsApiData) {
  const response: BoothRequestDetailsResponse = {
    status: true,
    message: "booth request retrived successfully",
    data: details,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function getRequestedUrl(input: RequestInfo | URL) {
  return typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function renderHarness(requests?: BoothRequestApiData[]) {
  return render(
    <StrictMode>
      <RequestDetailsHarness requests={requests} />
    </StrictMode>,
  );
}

function openRequestDetails(
  view: ReturnType<typeof renderHarness>,
  companyId = 37,
) {
  const row = view.getByRole("button", {
    name: `View details for Company #${companyId}`,
  });

  fireEvent.click(row);

  return row;
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
          ? JSON.stringify({ token: "details-test-token" })
          : null,
    } as Storage,
  });
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
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

test("clicking a row requests details with the selected request id", async () => {
  const requestedUrls: string[] = [];
  const requestMethods: string[] = [];
  globalThis.fetch = async (input, init) => {
    requestedUrls.push(getRequestedUrl(input));
    requestMethods.push(init?.method ?? "");
    return getResponse(firstDetails);
  };
  const view = renderHarness();

  openRequestDetails(view);

  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByRole("status"));
  await view.findByRole("heading", { name: "Dar Al feker" });

  assert.equal(requestedUrls.length, 1);
  assert.equal(
    new URL(requestedUrls[0] ?? "").pathname,
    "/api/v1/admin/booths/requests/901",
  );
  assert.equal(requestMethods[0], "GET");
});

test("the modal maps request and company details without mock content", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);

  const companyHeading = await view.findByRole("heading", {
    name: "Dar Al feker",
  });
  const dialog = view.getByRole("dialog");
  const profileCard = view
    .getByRole("heading", { name: "Company Profile" })
    .closest("section");
  const totalAmount = dialog.querySelector(
    ".booth-request-details-modal__total-amount",
  );

  assert.ok(companyHeading);
  assert.ok(profileCard);
  assert.match(dialog.textContent ?? "", /Lectures & Exhibitions/);
  assert.match(dialog.textContent ?? "", /Booth #1/);
  assert.match(dialog.textContent ?? "", /Jul 14, 2026/);
  assert.match(dialog.textContent ?? "", /Booth Booking/);
  assert.match(
    dialog.textContent ?? "",
    /Exhibitor booth request created for Dar Al feker\./,
  );
  assert.ok(within(profileCard).getByText("#1"));
  assert.ok(within(profileCard).getByText("2015"));
  assert.match(profileCard.textContent ?? "", /33\.513807, 36\.276528/);
  assert.equal(totalAmount?.textContent, "250");
  assert.match(dialog.textContent ?? "", /\+963112223334/);
  assert.equal(dialog.textContent?.includes("Nexora"), false);
  assert.equal(dialog.textContent?.includes("Maya Hassan"), false);
  assert.equal(dialog.textContent?.includes("maya.hassan"), false);
  assert.equal(dialog.textContent?.includes("Partnerships Manager"), false);
  assert.equal(dialog.textContent?.includes("Request #901"), false);

  const website = view.getByRole("link", { name: "Company website" });
  const linkedin = view.getByRole("link", { name: "Company LinkedIn" });
  assert.equal(website.getAttribute("href"), "https://dar.com/");
  assert.equal(linkedin.getAttribute("target"), "_blank");
  assert.equal(linkedin.getAttribute("rel"), "noopener noreferrer");
});

test("missing additional notes use the standard empty value", async () => {
  const detailsWithoutNotes = {
    ...firstDetails,
    reason_for_booking: undefined,
  } as unknown as BoothRequestDetailsApiData;
  globalThis.fetch = async () => getResponse(detailsWithoutNotes);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const notesCard = view
    .getByRole("heading", { name: "Additional Notes" })
    .closest("section");

  assert.ok(notesCard);
  assert.ok(within(notesCard).getByText("—"));
});

test("request status and company status remain separate", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  const dialog = view.getByRole("dialog");
  const statusBadge = within(dialog).getByLabelText("Status: Approved");
  const profileCard = view
    .getByRole("heading", { name: "Company Profile" })
    .closest("section");

  assert.ok(profileCard);
  assert.equal(statusBadge.textContent, "Approved");
  assert.match(statusBadge.className, /--approved/);
  assert.ok(within(profileCard).getByText("Pending"));
});

test("empty services and logo use safe presentation fallbacks", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });

  assert.ok(view.getByText("No requested services."));
  assert.ok(view.getAllByText("DA").length >= 2);
});

test("loading and API error states keep the modal open and support retry", async () => {
  let requestCount = 0;
  const successfulResponse = getResponse(firstDetails);
  globalThis.fetch = async () => {
    requestCount += 1;

    if (requestCount === 1) {
      return new Response(JSON.stringify({ message: "Details unavailable." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return successfulResponse;
  };
  const view = renderHarness();

  openRequestDetails(view);

  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByRole("status"));
  assert.ok(await view.findByRole("alert"));
  assert.ok(view.getByText("Details unavailable."));

  fireEvent.click(view.getByRole("button", { name: "Try again" }));

  await view.findByRole("heading", { name: "Dar Al feker" });
  assert.equal(requestCount, 2);
});

test("changing selection never displays stale request details", async () => {
  const firstDeferred = createDeferred<Response>();
  const secondDeferred = createDeferred<Response>();
  globalThis.fetch = async (input) =>
    getRequestedUrl(input).endsWith("/901")
      ? firstDeferred.promise
      : secondDeferred.promise;
  const view = renderHarness([firstRequest, secondRequest]);

  openRequestDetails(view, 37);
  openRequestDetails(view, 52);

  await act(async () => {
    firstDeferred.resolve(getResponse(firstDetails));
    await firstDeferred.promise;
  });

  assert.equal(view.queryByText("Dar Al feker"), null);
  assert.ok(view.getByRole("status"));

  await act(async () => {
    secondDeferred.resolve(getResponse(secondDetails));
    await secondDeferred.promise;
  });

  await view.findByRole("heading", { name: "Second Company" });
  assert.equal(view.queryByText("Dar Al feker"), null);
});

test("closing during a request prevents late details from reopening the modal", async () => {
  const deferredResponse = createDeferred<Response>();
  globalThis.fetch = async () => deferredResponse.promise;
  const view = renderHarness();

  openRequestDetails(view);
  fireEvent.click(view.getByRole("button", { name: "Close request details" }));

  await act(async () => {
    deferredResponse.resolve(getResponse(firstDetails));
    await deferredResponse.promise;
  });

  assert.equal(view.queryByRole("dialog"), null);
  assert.equal(view.queryByText("Dar Al feker"), null);
});

test("Approve and Reject remain UI-only", async () => {
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return getResponse(firstDetails);
  };
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  const detailsFetchCount = fetchCalls;

  fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
  fireEvent.click(view.getByRole("button", { name: "Reject" }));

  assert.equal(detailsFetchCount, 1);
  assert.equal(fetchCalls, detailsFetchCount);
});

test("the close, Escape, and backdrop interactions remain available", async () => {
  globalThis.fetch = async () => getResponse(firstDetails);
  const view = renderHarness();

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(view.queryByRole("dialog"), null);

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.mouseDown(view.getByRole("presentation"));
  assert.equal(view.queryByRole("dialog"), null);

  openRequestDetails(view);
  await view.findByRole("heading", { name: "Dar Al feker" });
  fireEvent.click(view.getByRole("button", { name: "Close request details" }));
  assert.equal(view.queryByRole("dialog"), null);
});

test("the details endpoint builder uses only the request id", async () => {
  const { buildBoothRequestDetailsPath } = await import(
    "../src/features/order/api/boothRequestDetailsApi.js"
  );

  assert.equal(buildBoothRequestDetailsPath(901), "booths/requests/901");
  assert.throws(() => buildBoothRequestDetailsPath(0));
});
