import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "../src/components/DataTable/DataTable.js";
import { BoothRequestDetailsModal } from "../src/features/order/components/BoothRequestDetailsModal/BoothRequestDetailsModal.js";
import { boothRequestDetailsMockData } from "../src/features/order/data/boothRequestDetailsMockData.js";
import type { BoothRequestApiData } from "../src/features/order/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const selectedRequest: BoothRequestApiData = {
  booth_id: 9,
  company_id: 37,
  created_at: "2026-07-14 10:01:00",
  final_price: 250,
  id: 901,
  reason_for_booking: "List data that is intentionally not shown yet.",
  status: "approved",
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

function RequestDetailsHarness() {
  const [request, setRequest] = useState<BoothRequestApiData | null>(null);

  return (
    <I18nProvider>
      <DataTable
        ariaLabel="Booth requests"
        columns={columns}
        getItemAriaLabel={(item) =>
          `View details for Company #${item.company_id}`
        }
        getItemKey={(item) => item.id}
        items={[selectedRequest]}
        onItemClick={setRequest}
      />
      {request ? (
        <BoothRequestDetailsModal
          details={boothRequestDetailsMockData}
          onClose={() => setRequest(null)}
          request={request}
        />
      ) : null}
    </I18nProvider>
  );
}

function openRequestDetails() {
  const view = render(<RequestDetailsHarness />);
  const row = view.getByRole("button", {
    name: "View details for Company #37",
  });

  fireEvent.click(row);

  return { row, view };
}

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

test("clicking a request row opens the selected request details", () => {
  const { view } = openRequestDetails();
  const dialog = view.getByRole("dialog");

  assert.match(dialog.textContent ?? "", /Company ID #37/);
  assert.match(dialog.textContent ?? "", /Booth #9/);
  assert.match(dialog.textContent ?? "", /July 14, 2026/);
  assert.equal(dialog.textContent?.includes("Request #901"), false);
});

test("the modal status badge matches the selected request", () => {
  const { view } = openRequestDetails();
  const dialog = view.getByRole("dialog");
  const statusBadge = within(dialog).getByLabelText("Status: Approved");

  assert.equal(statusBadge.textContent, "Approved");
  assert.match(statusBadge.className, /--approved/);
});

test("the request row and dialog expose their accessibility semantics", () => {
  const { row, view } = openRequestDetails();
  const dialog = view.getByRole("dialog");
  const labelledBy = dialog.getAttribute("aria-labelledby");

  assert.equal(row.getAttribute("role"), "button");
  assert.equal(row.getAttribute("tabindex"), "0");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.ok(labelledBy);
  assert.equal(document.getElementById(labelledBy)?.textContent, "Nexora Technologies");
});

test("Enter and Space activate an entire request row", () => {
  const view = render(<RequestDetailsHarness />);
  const row = view.getByRole("button", {
    name: "View details for Company #37",
  });

  fireEvent.keyDown(row, { key: "Enter" });
  assert.ok(view.getByRole("dialog"));
  fireEvent.click(view.getByRole("button", { name: "Close request details" }));

  fireEvent.keyDown(row, { key: " " });
  assert.ok(view.getByRole("dialog"));
});

test("the close button closes the modal and clears the selection", () => {
  const { view } = openRequestDetails();

  fireEvent.click(view.getByRole("button", { name: "Close request details" }));

  assert.equal(view.queryByRole("dialog"), null);
});

test("Escape closes the modal", () => {
  const { view } = openRequestDetails();

  fireEvent.keyDown(document, { key: "Escape" });

  assert.equal(view.queryByRole("dialog"), null);
});

test("clicking the backdrop closes the modal", () => {
  const { view } = openRequestDetails();
  const backdrop = view.getByRole("presentation");

  fireEvent.mouseDown(backdrop);

  assert.equal(view.queryByRole("dialog"), null);
});

test("Approve and Reject remain UI-only and send no API requests", () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 204 });
  };

  try {
    const { view } = openRequestDetails();

    fireEvent.click(view.getByRole("button", { name: "Approve Request" }));
    fireEvent.click(view.getByRole("button", { name: "Reject" }));

    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
