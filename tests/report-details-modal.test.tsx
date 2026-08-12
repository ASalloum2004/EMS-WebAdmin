import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import {
  formatReportDetailsDate,
  ReportDetailsModal,
} from "../src/features/reports/components/ReportDetailsModal/ReportDetailsModal.js";
import type { ReportDetails } from "../src/features/reports/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";

const pendingDetails: ReportDetails = {
  admin_notes: "Reviewed by the moderation team.",
  created_at: "2026-08-12T10:52:59.000000Z",
  description:
    "The complete description is intentionally displayed in the details view.",
  id: 7,
  status: "pending",
  title: "Outdated information",
};

const defaultProps = {
  details: pendingDetails,
  error: "",
  isLoading: false,
  onClose: () => undefined,
  onRetry: () => undefined,
  reportId: 7,
};

function renderDetailsModal(
  props: Partial<Parameters<typeof ReportDetailsModal>[0]> = {},
) {
  return render(
    <I18nProvider>
      <ReportDetailsModal {...defaultProps} {...props} />
    </I18nProvider>,
  );
}

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  document.body.style.overflow = "";
});

test("renders every confirmed Report field and disabled pending actions", () => {
  const view = renderDetailsModal();
  const renderedText = view.container.textContent ?? "";

  assert.match(renderedText, /Report Details/);
  assert.match(renderedText, /#7/);
  assert.match(renderedText, /Outdated information/);
  assert.match(renderedText, /The complete description is intentionally displayed/);
  assert.match(renderedText, /Reviewed by the moderation team/);
  assert.match(renderedText, /Pending/);
  assert.match(
    renderedText,
    new RegExp(formatReportDetailsDate(pendingDetails.created_at, "en", "Invalid date")),
  );

  const rejectButton = view.getByRole("button", { name: "Reject" });
  const approveButton = view.getByRole("button", { name: "Approve" });
  assert.equal(rejectButton.hasAttribute("disabled"), true);
  assert.equal(approveButton.hasAttribute("disabled"), true);
  assert.ok(
    view.getByText(
      "Report actions are unavailable until the backend contract is confirmed.",
    ),
  );
});

test("renders intentional empty notes and invalid date fallbacks", () => {
  const view = renderDetailsModal({
    details: {
      ...pendingDetails,
      admin_notes: "   ",
      created_at: "not-a-date",
    },
  });

  assert.ok(view.getByText("No admin notes"));
  assert.ok(view.getByText("Invalid date"));
});

for (const status of ["resolved", "rejected"] as const) {
  test(`renders ${status} as a final state without active actions`, () => {
    const view = renderDetailsModal({
      details: { ...pendingDetails, status },
    });

    assert.ok(view.getByText("Final Status"));
    assert.ok(view.getAllByText(status === "resolved" ? "Resolved" : "Rejected"));
    assert.equal(view.queryByRole("button", { name: "Approve" }), null);
    assert.equal(view.queryByRole("button", { name: "Reject" }), null);
  });
}

test("supports loading, error, retry, close, Escape, and backdrop dismissal", () => {
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

  assert.ok(view.getByText("Loading report details"));
  view.rerender(
    <I18nProvider>
      <ReportDetailsModal
        {...defaultProps}
        details={null}
        error="Backend details error."
        onClose={() => {
          closeCount += 1;
        }}
        onRetry={() => {
          retryCount += 1;
        }}
      />
    </I18nProvider>,
  );

  assert.ok(view.getByRole("alert"));
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  fireEvent.click(view.getByRole("button", { name: "Close report details" }));
  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(view.container.querySelector(".report-details-modal")!);

  assert.equal(retryCount, 1);
  assert.equal(closeCount, 3);
});
