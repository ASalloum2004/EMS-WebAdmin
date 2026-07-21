import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import {
  EventRequestDetailsModal,
  type EventRequestDetailsModalProps,
} from "../src/features/order/components/EventRequestDetailsModal/EventRequestDetailsModal.js";
import type { EventRequestDetails } from "../src/features/order/types.js";
import { I18nProvider } from "../src/i18n/I18nContext.js";
import { ar } from "../src/i18n/locales/ar.js";
import { en } from "../src/i18n/locales/en.js";

const fullDetails: EventRequestDetails = {
  id: 3,
  title: "The Future of Publishing",
  event_hall_id: 3,
  type: "conference",
  status: "approved",
  start_at: "2026-07-24T11:00:00.000000Z",
  end_at: "2026-07-24T14:00:00.000000Z",
  duration: 3,
  description: "A conference exploring digital transformation in publishing.",
  qr_token: "QR_METADATA_VALUE",
  eventable: {
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
    status: "pending",
  },
  speakers: [
    { id: 4, name: "Fawzy" },
    { id: 5, name: "Elcoach" },
  ],
  average_rating: null,
  qr_scans_count: 0,
  saved_count: 0,
  created_at: "2026-07-21T08:00:55.000000Z",
  logo: null,
};

const defaultProps: Pick<
  EventRequestDetailsModalProps,
  "error" | "isLoading" | "onClose" | "onRetry"
> = {
  error: "",
  isLoading: false,
  onClose: () => undefined,
  onRetry: () => undefined,
};
const originalFetch = globalThis.fetch;

function renderModal(
  details: EventRequestDetails | null,
  props: Partial<typeof defaultProps> = {},
) {
  return render(
    <I18nProvider>
      <EventRequestDetailsModal
        {...defaultProps}
        {...props}
        details={details}
      />
    </I18nProvider>,
  );
}

beforeEach(() => {
  window.localStorage.setItem("ems-language", "en");
});

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  globalThis.fetch = originalFetch;
  window.localStorage.clear();
});

test("renders every Event detail section and excludes organizer coordinates", () => {
  const view = renderModal(fullDetails);
  const dialog = view.getByRole("dialog", {
    name: "The Future of Publishing",
  });

  assert.ok(within(dialog).getByText("Request #3"));
  assert.ok(within(dialog).getByText("Conference"));
  assert.ok(within(dialog).getByRole("status", { name: "Approved" }));
  assert.ok(within(dialog).getByText("Event information"));
  assert.ok(within(dialog).getByText("Event Hall"));
  assert.ok(within(dialog).getAllByText("#3").length);
  assert.ok(within(dialog).getByText("3 hours"));
  assert.ok(within(dialog).getAllByText(/2026/).length >= 3);
  assert.ok(
    within(dialog).getByText(
      "A conference exploring digital transformation in publishing.",
    ),
  );

  assert.ok(within(dialog).getByText("Dar Al feker"));
  assert.ok(within(dialog).getByText("Lectures & Exhibitions"));
  assert.ok(within(dialog).getByText("+963112223334"));
  assert.ok(within(dialog).getByText("2015"));
  assert.ok(within(dialog).getByText("Leading readers for reading."));
  const website = within(dialog).getByRole("link", {
    name: "https://dar.com/",
  });
  const linkedin = within(dialog).getByRole("link", {
    name: "https://linkedin.com/company/dar",
  });
  assert.equal(website.getAttribute("target"), "_blank");
  assert.equal(website.getAttribute("rel"), "noopener noreferrer");
  assert.equal(linkedin.getAttribute("target"), "_blank");
  assert.equal(linkedin.getAttribute("rel"), "noopener noreferrer");
  assert.equal(within(dialog).queryByText("headquarters_lat"), null);
  assert.equal(within(dialog).queryByText("headquarters_lng"), null);
  assert.equal(within(dialog).queryByText("33.513807"), null);
  assert.equal(within(dialog).queryByText("36.276528"), null);

  assert.ok(within(dialog).getByText("Fawzy"));
  assert.ok(within(dialog).getByText("Speaker ID #4"));
  assert.ok(within(dialog).getByText("Elcoach"));
  assert.ok(within(dialog).getByText("Speaker ID #5"));
  assert.ok(within(dialog).getByText("Not rated yet"));
  assert.equal(within(dialog).getAllByText("0").length, 2);
  assert.ok(within(dialog).getByText("QR_METADATA_VALUE"));
  assert.ok(
    within(dialog).getAllByLabelText(
      "Event logo: The Future of Publishing",
    ).length >= 2,
  );
});

test("handles null organizer, QR metadata, logo, and zero, one, or many speakers", () => {
  const emptyDetails: EventRequestDetails = {
    ...fullDetails,
    eventable: null,
    speakers: [],
    qr_token: null,
    logo: null,
  };
  const emptyView = renderModal(emptyDetails);

  assert.ok(emptyView.getByText("No organizer information is available."));
  assert.ok(emptyView.getByText("No speakers are assigned to this event."));
  assert.ok(emptyView.getAllByText("Not available").length);
  assert.ok(
    emptyView.getAllByLabelText("Event logo: The Future of Publishing").length,
  );
  emptyView.unmount();

  const oneSpeakerView = renderModal({
    ...fullDetails,
    speakers: [fullDetails.speakers[0]],
  });
  assert.ok(oneSpeakerView.getByText("Fawzy"));
  assert.equal(oneSpeakerView.queryByText("Elcoach"), null);
  oneSpeakerView.unmount();

  const manySpeakerView = renderModal(fullDetails);
  assert.ok(manySpeakerView.getByText("Fawzy"));
  assert.ok(manySpeakerView.getByText("Elcoach"));
});

test("renders only safe social links and a safe telephone link", () => {
  const view = renderModal({
    ...fullDetails,
    eventable: {
      ...fullDetails.eventable!,
      social_links: {
        website: "javascript:unsafe()",
        linkedin: "not a url",
      },
    },
  });

  assert.equal(view.queryByRole("link", { name: "javascript:unsafe()" }), null);
  assert.equal(view.queryByRole("link", { name: "not a url" }), null);
  assert.ok(view.getAllByText("Not available").length >= 2);
  assert.equal(
    view.getByRole("link", { name: "+963112223334" }).getAttribute("href"),
    "tel:+963112223334",
  );
});

test("pending actions are presentational while terminal and unknown states are non-interactive", () => {
  let networkRequests = 0;
  globalThis.fetch = async () => {
    networkRequests += 1;
    throw new Error("The modal must not make requests.");
  };
  const pendingView = renderModal({ ...fullDetails, status: "pending" });
  const rejectButton = pendingView.getByRole("button", { name: "Reject" });
  const approveButton = pendingView.getByRole("button", { name: "Approve" });

  fireEvent.click(rejectButton);
  fireEvent.click(approveButton);
  assert.equal(networkRequests, 0);
  assert.ok(pendingView.getByLabelText("Status: Pending"));
  assert.equal(pendingView.queryByRole("status", { name: "Approved" }), null);
  pendingView.unmount();

  const approvedView = renderModal(fullDetails);
  assert.ok(approvedView.getByRole("status", { name: "Approved" }));
  assert.equal(approvedView.queryByRole("button", { name: "Reject" }), null);
  assert.equal(approvedView.queryByRole("button", { name: "Approve" }), null);
  approvedView.unmount();

  const rejectedView = renderModal({ ...fullDetails, status: "rejected" });
  assert.ok(rejectedView.getByRole("status", { name: "Rejected" }));
  assert.equal(rejectedView.queryByRole("button", { name: "Reject" }), null);
  assert.equal(rejectedView.queryByRole("button", { name: "Approve" }), null);
  rejectedView.unmount();

  const unknownView = renderModal({ ...fullDetails, status: "archived" });
  assert.ok(unknownView.getByRole("status", { name: "Archived" }));
  assert.equal(unknownView.queryByRole("button", { name: "Reject" }), null);
  assert.equal(unknownView.queryByRole("button", { name: "Approve" }), null);

});

test("supports loading, errors, Retry, Close, Escape, and backdrop dismissal", () => {
  let closeCount = 0;
  let retryCount = 0;
  const onClose = () => {
    closeCount += 1;
  };
  const view = renderModal(null, {
    isLoading: true,
    onClose,
    onRetry: () => {
      retryCount += 1;
    },
  });

  assert.ok(view.getByRole("status"));
  assert.ok(view.getAllByText("Loading Event Request details...").length);
  assert.ok(
    view.getByRole("button", { name: "Close Event Request details" }),
  );

  view.rerender(
    <I18nProvider>
      <EventRequestDetailsModal
        details={null}
        error="Backend details error."
        isLoading={false}
        onClose={onClose}
        onRetry={() => {
          retryCount += 1;
        }}
      />
    </I18nProvider>,
  );
  assert.equal(view.getByRole("alert").textContent, "Backend details error.Try again");
  fireEvent.click(view.getByRole("button", { name: "Try again" }));
  assert.equal(retryCount, 1);

  fireEvent.keyDown(document, { key: "Escape" });
  fireEvent.mouseDown(view.getByRole("presentation"));
  fireEvent.click(
    view.getByRole("button", { name: "Close Event Request details" }),
  );
  assert.equal(closeCount, 3);
});

test("renders translated Arabic modal labels", () => {
  window.localStorage.setItem("ems-language", "ar");
  const view = renderModal(fullDetails);

  assert.ok(view.getByText(ar.order.eventRequests.details.eventInformation));
  assert.ok(view.getByText(ar.order.eventRequests.details.organizerInformation));
  assert.ok(view.getByText(ar.order.eventRequests.details.speakers));
  assert.ok(view.getByText(ar.order.eventRequests.details.engagement));
  assert.ok(
    view.getByText(ar.order.eventRequests.details.additionalInformation),
  );
  assert.ok(view.getByText(ar.order.eventRequests.table.types.conference));
  assert.ok(view.getByRole("status", { name: ar.order.status.approved }));
  assert.equal(document.documentElement.dir, "rtl");

  assert.notEqual(
    ar.order.eventRequests.details.title,
    en.order.eventRequests.details.title,
  );
});
