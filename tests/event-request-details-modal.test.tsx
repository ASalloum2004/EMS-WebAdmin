import "./setup-dom.js";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
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
    avatar: null,
    name: "Dar Al feker",
    email: "hello@dar.com",
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

const defaultProps: Omit<EventRequestDetailsModalProps, "details"> = {
  approveConflict: null,
  approveConflictError: "",
  approveError: "",
  error: "",
  isApproving: false,
  isLoading: false,
  isLoadingApproveConflicts: false,
  isRejecting: false,
  onApprove: () => null,
  onApproveAnyway: () => null,
  onApproveConflictPageChange: () => null,
  onClearApproveError: () => undefined,
  onClearRejectError: () => undefined,
  onClose: () => undefined,
  onCloseApproveConflict: () => undefined,
  onReject: () => null,
  onRetry: () => undefined,
  rejectError: "",
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
  assert.ok(within(dialog).getByText("hello@dar.com"));
  assert.equal(within(dialog).queryByText("Business sector"), null);
  assert.equal(within(dialog).queryByText("Phone"), null);
  assert.equal(within(dialog).queryByText("Year founded"), null);
  assert.equal(within(dialog).queryByText("Company status"), null);
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
  assert.equal(within(dialog).queryByText("QR_METADATA_VALUE"), null);
  assert.equal(
    within(dialog).queryByText("Additional event information"),
    null,
  );
  const avatar = dialog.querySelector<HTMLElement>(
    ".event-request-details-modal__avatar",
  );
  assert.ok(avatar);
  assert.equal(avatar.textContent, "TF");
  assert.equal(avatar.getAttribute("aria-hidden"), "true");
  assert.ok(within(dialog).getByRole("heading", { name: fullDetails.title! }));
  assert.ok(
    within(dialog).getByRole("button", {
      name: "Close Event Request details",
    }),
  );
});

test("renders the Event logo placeholder above the details content grid", () => {
  const view = renderModal({ ...fullDetails, logo: null });
  const placeholder = view.getByRole("img", { name: "Event logo" });
  const scrollArea = view.container.querySelector<HTMLElement>(
    ".event-request-details-modal__scroll-area",
  );
  const contentGrid = view.container.querySelector<HTMLElement>(
    ".event-request-details-modal__content-grid",
  );

  assert.ok(scrollArea);
  assert.ok(contentGrid);
  assert.match(placeholder.className, /__logo-showcase/);
  assert.equal(scrollArea.firstElementChild, placeholder);
  assert.equal(placeholder.nextElementSibling, contentGrid);
  assert.ok(view.getByText("The Event logo will appear here when available."));
  assert.equal(placeholder.querySelector("img"), null);
});

test("renders organizer name and email without company profile fields", () => {
  const view = renderModal({
    ...fullDetails,
    eventable: {
      ...fullDetails.eventable!,
      id: 3,
      name: "Elcoach",
      email: "zuheiralhomsi73@gmail.com",
    },
  });
  const organizerHeading = view.getByRole("heading", {
    name: "Organizer information",
  });
  const organizerCard = organizerHeading.closest("section");
  const engagementCard = view
    .getByRole("heading", { name: "Engagement" })
    .closest("section");
  const speakersCard = view
    .getByRole("heading", { name: "Speakers" })
    .closest("section");

  assert.ok(organizerCard);
  assert.ok(within(organizerCard).getByText("Organizer Name"));
  assert.ok(within(organizerCard).getByText("Elcoach"));
  assert.ok(within(organizerCard).getByText("Organizer Email"));
  assert.ok(
    within(organizerCard).getByText("zuheiralhomsi73@gmail.com"),
  );
  assert.equal(within(organizerCard).queryByText("Business sector"), null);
  assert.equal(within(organizerCard).queryByText("Phone"), null);
  assert.equal(within(organizerCard).queryByText("Year founded"), null);
  assert.equal(within(organizerCard).queryByText("Company status"), null);
  assert.equal(
    organizerCard.querySelector(".event-request-details-modal__organizer-avatar"),
    null,
  );
  assert.ok(engagementCard);
  assert.ok(speakersCard);
  assert.equal(engagementCard.parentElement, speakersCard.parentElement);
  assert.equal(engagementCard.nextElementSibling, speakersCard);
});

test("handles null organizer and zero, one, or many speakers", () => {
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
  assert.ok(emptyView.getByText("TF"));
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

test("renders the Event logo only in the showcase and handles image failure", () => {
  const logoUrl = "https://events.example/event-logo.png";
  const view = renderModal({ ...fullDetails, logo: logoUrl });
  const dialog = view.getByRole("dialog", {
    name: "The Future of Publishing",
  });
  const logo = within(dialog).getByRole("img", {
    name: "Event logo: The Future of Publishing",
  });

  assert.equal(logo.getAttribute("src"), logoUrl);
  assert.match(
    logo.closest<HTMLElement>(
      ".event-request-details-modal__logo-showcase",
    )?.className ?? "",
    /__logo-showcase/,
  );
  const headerAvatar = dialog.querySelector<HTMLElement>(
    ".event-request-details-modal__avatar",
  );
  assert.ok(headerAvatar);
  assert.equal(headerAvatar.textContent, "TF");
  assert.equal(headerAvatar.querySelector("img"), null);

  fireEvent.error(logo);

  assert.equal(
    within(dialog).queryByRole("img", {
      name: "Event logo: The Future of Publishing",
    }),
    null,
  );
  assert.ok(within(dialog).getByRole("img", { name: "Event logo" }));
  assert.ok(
    within(dialog).getByText(
      "The Event logo will appear here when available.",
    ),
  );
  assert.equal(headerAvatar.textContent, "TF");
});

test("renders normalized backend engagement metrics", () => {
  const view = renderModal({
    ...fullDetails,
    average_rating: 4.25,
    qr_scans_count: 38,
    saved_count: 12,
  });
  const engagementCard = view
    .getByRole("heading", { name: "Engagement" })
    .closest("section");

  assert.ok(engagementCard);
  assert.ok(within(engagementCard).getByText("4.3"));
  assert.ok(within(engagementCard).getByText("38"));
  assert.ok(within(engagementCard).getByText("12"));
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

test("opens Event-specific confirmation dialogs before Approve or Reject mutations", async () => {
  let approveCalls = 0;
  let rejectCalls = 0;
  const pendingDetails = { ...fullDetails, status: "pending" };
  const view = renderModal(pendingDetails, {
    onApprove: (eventRequestId) => {
      approveCalls += 1;
      assert.equal(eventRequestId, pendingDetails.id);
      return {
        kind: "approved",
        response: { status: true, message: "Success", data: null },
      };
    },
    onReject: (eventRequestId) => {
      rejectCalls += 1;
      assert.equal(eventRequestId, pendingDetails.id);
      return { status: true, message: "Success", data: null };
    },
  });

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  assert.equal(approveCalls, 0);
  let confirmation = view.getByRole("alertdialog", {
    name: "Approve Event Request?",
  });
  assert.ok(within(confirmation).getByText("The Future of Publishing"));
  assert.ok(within(confirmation).getByText("#3"));
  const detailsDialog = view.container.querySelector<HTMLElement>(
    ".event-request-details-modal__dialog",
  );
  assert.ok(detailsDialog);
  assert.equal(detailsDialog.getAttribute("aria-hidden"), "true");
  assert.equal(detailsDialog.hasAttribute("inert"), true);

  await act(async () => {
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Approve Request" }),
    );
    await Promise.resolve();
  });
  assert.equal(approveCalls, 1);
  assert.equal(view.queryByRole("alertdialog"), null);

  fireEvent.click(view.getByRole("button", { name: "Reject" }));
  assert.equal(rejectCalls, 0);
  confirmation = view.getByRole("alertdialog", {
    name: "Reject Event Request?",
  });
  assert.ok(
    within(confirmation).getByText(
      "Are you sure you want to reject this Event Request? This action cannot be undone.",
    ),
  );
  await act(async () => {
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Reject Request" }),
    );
    await Promise.resolve();
  });
  assert.equal(rejectCalls, 1);
  assert.equal(view.queryByRole("alertdialog"), null);
});

test("confirmation loading states disable cancellation and duplicate submission", () => {
  const pendingDetails = { ...fullDetails, status: "pending" };
  const view = renderModal(pendingDetails);

  fireEvent.click(view.getByRole("button", { name: "Approve" }));
  view.rerender(
    <I18nProvider>
      <EventRequestDetailsModal
        {...defaultProps}
        details={pendingDetails}
        isApproving
      />
    </I18nProvider>,
  );

  const approvingDialog = view.getByRole("alertdialog", {
    name: "Approve Event Request?",
  });
  const approvingButton = within(approvingDialog).getByRole("button", {
    name: "Approving…",
  }) as HTMLButtonElement;
  const cancelButton = within(approvingDialog).getByRole("button", {
    name: "Cancel",
  }) as HTMLButtonElement;

  assert.equal(approvingButton.disabled, true);
  assert.equal(cancelButton.disabled, true);
  fireEvent.keyDown(window, { key: "Escape" });
  assert.ok(view.getByRole("alertdialog", { name: "Approve Event Request?" }));
});

test("renders Event approval conflicts with translated null-message fallback and safe fields", () => {
  let forceApproveCalls = 0;
  let requestedPage = 0;
  const view = renderModal(
    { ...fullDetails, status: "pending" },
    {
      approveConflict: {
        message: null,
        meta: {
          current_page: 1,
          per_page: 3,
          total: 4,
          last_page: 2,
        },
        requestId: fullDetails.id,
        requests: [
          {
            id: 9,
            title: "Approval Conflict Pair B",
            event_hall_id: 3,
            type: "conference",
            status: "pending",
            start_at: "2026-08-12T10:00:00.000000Z",
            end_at: "2026-08-12T12:00:00.000000Z",
            duration: 2,
            created_at: "2026-07-21T14:05:08.000000Z",
            eventable: { name: "Dar Al feker" },
          },
        ],
      },
      onApproveAnyway: () => {
        forceApproveCalls += 1;
        return null;
      },
      onApproveConflictPageChange: (page) => {
        requestedPage = page;
        return null;
      },
    },
  );
  const conflictDialog = view.getByRole("alertdialog", {
    name: "Conflicting Event Requests",
  });

  assert.ok(
    within(conflictDialog).getByText(
      "Other pending Event Requests overlap with request #3 in the same hall and schedule. Review them before approving anyway.",
    ),
  );
  assert.ok(within(conflictDialog).getByText("Approval Conflict Pair B"));
  assert.ok(within(conflictDialog).getByText("Dar Al feker"));
  assert.ok(within(conflictDialog).getByText("Conference"));
  assert.ok(within(conflictDialog).getByText("2 hours"));
  assert.equal(within(conflictDialog).queryByText("qr_token"), null);
  assert.equal(within(conflictDialog).queryByText("logo"), null);

  fireEvent.click(
    within(conflictDialog).getByRole("button", { name: "2" }),
  );
  assert.equal(requestedPage, 2);
  assert.equal(forceApproveCalls, 0);

  fireEvent.click(
    within(conflictDialog).getByRole("button", { name: "Approve Anyway" }),
  );
  assert.equal(forceApproveCalls, 1);
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
  const loadingAvatar = view.container.querySelector<HTMLElement>(
    ".event-request-details-modal__avatar",
  );
  assert.ok(loadingAvatar);
  assert.equal(loadingAvatar.textContent, "—");
  assert.equal(loadingAvatar.getAttribute("aria-hidden"), "true");
  assert.ok(
    view.getByRole("button", { name: "Close Event Request details" }),
  );

  view.rerender(
    <I18nProvider>
      <EventRequestDetailsModal
        {...defaultProps}
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
  const errorAvatar = view.container.querySelector<HTMLElement>(
    ".event-request-details-modal__avatar",
  );
  assert.ok(errorAvatar);
  assert.equal(errorAvatar.textContent, "—");
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
    view.getByRole("img", {
      name: ar.order.eventRequests.details.logoShowcase.title,
    }),
  );
  assert.ok(
    view.getByText(ar.order.eventRequests.details.logoShowcase.description),
  );
  assert.ok(view.getByText(ar.order.eventRequests.table.types.conference));
  assert.ok(view.getByRole("status", { name: ar.order.status.approved }));
  assert.equal(document.documentElement.dir, "rtl");

  assert.notEqual(
    ar.order.eventRequests.details.title,
    en.order.eventRequests.details.title,
  );
});
