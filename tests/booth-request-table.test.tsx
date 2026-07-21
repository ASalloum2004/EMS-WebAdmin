import "./setup-dom.js";
import assert from "node:assert/strict";
import test from "node:test";
import { useState } from "react";
import { fireEvent, render } from "@testing-library/react";
import { DataTable } from "../src/components/DataTable/DataTable.js";
import {
  getBoothRequestColumns,
  getBoothRequestCompanyDisplayName,
} from "../src/features/order/components/orderTableColumns.js";
import type { BoothRequestApiData } from "../src/features/order/types.js";
import { en } from "../src/i18n/locales/en.js";

const requests: BoothRequestApiData[] = [
  {
    id: 3,
    booth_id: 4,
    company_id: 2,
    company_name: "GreenFoods Co.",
    status: "pending",
    reason_for_booking: "Pending review for a second booth allocation.",
    final_price: 200,
    created_at: "2026-07-21 12:01:01",
    company: {
      id: 2,
      name: "GreenFoods Co.",
      business_sector: null,
      phone: null,
      description: null,
      year_founded: null,
      social_links: null,
      headquarters_lat: 0,
      headquarters_lng: 0,
      status: null,
    },
  },
  {
    id: 8,
    booth_id: 14,
    company_id: 22,
    company_name: "",
    status: "approved",
    reason_for_booking: "",
    final_price: 250,
    created_at: "2026-07-22 12:01:01",
    company: {
      id: 22,
      name: "Nested Company Co.",
      business_sector: null,
      phone: null,
      description: null,
      year_founded: null,
      social_links: null,
      headquarters_lat: 0,
      headquarters_lng: 0,
      status: null,
    },
  },
  {
    id: 9,
    booth_id: 17,
    company_id: 31,
    company_name: null,
    status: "rejected",
    reason_for_booking: "",
    final_price: 300,
    created_at: "2026-07-23 12:01:01",
    company: null,
  },
];

function BoothRequestsTableHarness() {
  const [openedRequestId, setOpenedRequestId] = useState<number | null>(null);

  return (
    <>
      <DataTable
        ariaLabel="Booth requests"
        columns={getBoothRequestColumns(en, "en")}
        getItemAriaLabel={(request) => `View details for ${request.company_name}`}
        getItemKey={(request) => request.id}
        items={requests}
        onItemClick={(request) => setOpenedRequestId(request.id)}
      />
      {openedRequestId !== null ? (
        <p>Opened request #{openedRequestId}</p>
      ) : null}
    </>
  );
}

test("renders booth company names, request IDs, and preserves row behavior", () => {
  const view = render(<BoothRequestsTableHarness />);

  assert.ok(view.getByText("GreenFoods Co."));
  assert.ok(view.getByText("Request #3"));
  assert.equal(view.queryByText("Company #2"), null);
  assert.equal(view.queryByText("Request #2"), null);
  assert.equal(view.queryByText("Request #4"), null);
  assert.ok(view.getByText("Booth #4"));
  assert.ok(view.getByText("Pending"));
  assert.ok(view.getByText("Jul 21, 2026"));

  assert.ok(view.getByText("Nested Company Co."));
  assert.ok(view.getByText("Request #8"));
  assert.ok(view.getByText("Company #31"));

  fireEvent.click(view.getAllByRole("button")[0]!);
  assert.ok(view.getByText("Opened request #3"));
});

test("uses nested company names before the translated company fallback", () => {
  const nestedCompanyRequest = requests[1]!;

  assert.equal(
    getBoothRequestCompanyDisplayName(
      { ...nestedCompanyRequest, company_name: null },
      en,
    ),
    "Nested Company Co.",
  );
  assert.equal(
    getBoothRequestCompanyDisplayName(
      { ...nestedCompanyRequest, company_name: "" },
      en,
    ),
    "Nested Company Co.",
  );
  assert.equal(getBoothRequestCompanyDisplayName(requests[2]!, en), "Company #31");
});
