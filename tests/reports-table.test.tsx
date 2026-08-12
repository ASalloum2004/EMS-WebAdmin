import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, render } from "@testing-library/react";
import {
  formatReportDate,
  ReportTable,
} from "../src/features/reports/components/ReportTable/ReportTable.js";
import type { ReportItem } from "../src/features/reports/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const report: ReportItem = {
  admin_notes: null,
  created_at: "2026-08-12T10:52:59.000000Z",
  id: 2,
  status: "rejected",
  title: "Content needs clarification",
};

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test("renders notes presence without exposing IDs, descriptions, or note text", () => {
  const reports: Array<ReportItem & { description: string }> = [
    {
      ...report,
      description: "Backend-only description one.",
      id: 101,
      title: "Null notes",
    },
    {
      ...report,
      admin_notes: "",
      description: "Backend-only description two.",
      id: 102,
      title: "Empty notes",
    },
    {
      ...report,
      admin_notes: "   ",
      description: "Backend-only description three.",
      id: 103,
      title: "Whitespace notes",
    },
    {
      ...report,
      admin_notes: "Checked by admin",
      description: "Backend-only description four.",
      id: 104,
      title: "Present notes",
    },
  ];
  const view = render(
    <I18nProvider>
      <ReportTable emptyMessage="No reports." items={reports} />
    </I18nProvider>,
  );

  assert.equal(view.getAllByText("Admin Notes").length, 4);
  assert.equal(view.getAllByText("No Notes").length, 3);
  assert.ok(view.getByText("Has Notes"));
  assert.ok(view.getByText("Present notes"));
  assert.equal(view.getAllByText("Rejected").length, 4);
  assert.equal(
    view.getAllByText(formatReportDate(report.created_at, "en")).length,
    4,
  );
  assert.equal(view.queryByText("101"), null);
  assert.equal(view.queryByText("102"), null);
  assert.equal(view.queryByText("103"), null);
  assert.equal(view.queryByText("104"), null);
  assert.equal(view.queryByText("Checked by admin"), null);
  assert.equal(view.queryByText("Backend-only description one."), null);
});

test("renders the shared DataTable empty state without fake rows", () => {
  const view = render(
    <I18nProvider>
      <ReportTable emptyMessage="No reports." items={[]} />
    </I18nProvider>,
  );

  assert.equal(view.getByText("No reports.").classList.contains("data-table__empty"), true);
});
