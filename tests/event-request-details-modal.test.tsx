import "./setup-dom.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("renders the organizer identity with the Booth large-avatar contract", () => {
  const eventLogoUrl = "https://events.example/event-logo.png";
  const organizerAvatarUrl = "https://organizers.example/avatar.png";
  const view = renderModal({
    ...fullDetails,
    eventable: {
      ...fullDetails.eventable!,
      avatar: organizerAvatarUrl,
    },
    logo: eventLogoUrl,
  });
  assert.equal(
    view
      .getByRole("img", {
        name: "Event logo: The Future of Publishing",
      })
      .getAttribute("src"),
    eventLogoUrl,
  );
  const organizerHeading = view.getByRole("heading", {
    name: "Organizer information",
  });
  const organizerCard = organizerHeading.closest("section");

  assert.ok(organizerCard);

  const identity = organizerCard.querySelector<HTMLElement>(
    ".event-request-details-modal__organizer-heading",
  );
  const avatar = organizerCard.querySelector<HTMLElement>(
    ".event-request-details-modal__organizer-avatar",
  );
  const copy = organizerCard.querySelector<HTMLElement>(
    ".event-request-details-modal__organizer-copy",
  );

  assert.ok(identity);
  assert.ok(avatar);
  assert.ok(copy);
  assert.equal(identity.firstElementChild, avatar);
  assert.equal(identity.lastElementChild, copy);
  assert.equal(avatar.getAttribute("aria-hidden"), "true");
  const organizerLogo = avatar.querySelector<HTMLImageElement>("img");
  assert.ok(organizerLogo);
  assert.equal(organizerLogo.getAttribute("src"), organizerAvatarUrl);
  assert.notEqual(organizerLogo.getAttribute("src"), eventLogoUrl);
  assert.equal(organizerLogo.getAttribute("alt"), "");
  assert.ok(within(copy).getByText("Dar Al feker"));

  const status = within(copy).getByText("Pending");
  assert.match(status.className, /event-request-details-modal__organizer-status/);
  assert.match(status.className, /--pending/);
  assert.equal(within(organizerCard).queryByText("Company name"), null);

  assert.ok(within(organizerCard).getByText("Lectures & Exhibitions"));
  assert.ok(within(organizerCard).getByText("+963112223334"));
  assert.ok(within(organizerCard).getByText("2015"));
  assert.ok(
    within(organizerCard).getByText("Leading readers for reading."),
  );
  assert.equal(within(organizerCard).queryByText("QR_METADATA_VALUE"), null);
  assert.equal(
    view.queryByText("Additional event information"),
    null,
  );

  const organizerStyles = readFileSync(
    "src/features/order/components/EventRequestDetailsModal/EventRequestOrganizerSection.scss",
    "utf8",
  );

  assert.match(
    organizerStyles,
    /\.event-request-details-modal__organizer-heading\s*\{[\s\S]*?display: flex;[\s\S]*?gap: 13px;/,
  );
  assert.match(
    organizerStyles,
    /\.event-request-details-modal__organizer-avatar\s*\{[\s\S]*?width: 58px;[\s\S]*?height: 58px;[\s\S]*?flex-basis: 58px;[\s\S]*?border: 1px solid var\(--ems-color-primary\);[\s\S]*?border-radius: 16px;[\s\S]*?font-size: 18px;/,
  );
  assert.match(
    organizerStyles,
    /@media \(max-width: 640px\)\s*\{[\s\S]*?\.event-request-details-modal__organizer-avatar\s*\{[\s\S]*?width: 54px;[\s\S]*?height: 54px;[\s\S]*?flex-basis: 54px;/,
  );
});

test("falls back for missing or broken organizer avatars without reusing the Event logo", () => {
  const eventLogoUrl = "https://events.example/event-logo.png";
  const nullLogoView = renderModal({
    ...fullDetails,
    eventable: { ...fullDetails.eventable!, avatar: null },
    logo: eventLogoUrl,
  });
  const nullLogoAvatar = nullLogoView.container.querySelector<HTMLElement>(
    ".event-request-details-modal__organizer-avatar",
  );

  assert.ok(nullLogoAvatar);
  assert.equal(nullLogoAvatar.textContent, "DA");
  assert.equal(nullLogoAvatar.querySelector("img"), null);
  nullLogoView.unmount();

  const failedLogoView = renderModal({
    ...fullDetails,
    eventable: {
      ...fullDetails.eventable!,
      avatar: "https://organizers.example/broken-avatar.png",
    },
    logo: eventLogoUrl,
  });
  const failedLogoAvatar =
    failedLogoView.container.querySelector<HTMLElement>(
      ".event-request-details-modal__organizer-avatar",
    );
  const failedLogo = failedLogoAvatar?.querySelector<HTMLImageElement>("img");

  assert.ok(failedLogoAvatar);
  assert.ok(failedLogo);
  fireEvent.error(failedLogo);
  assert.equal(failedLogoAvatar.querySelector("img"), null);
  assert.equal(failedLogoAvatar.textContent, "DA");
  assert.equal(failedLogoAvatar.getAttribute("aria-hidden"), "true");
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
  const organizerAvatar = dialog.querySelector<HTMLElement>(
    ".event-request-details-modal__organizer-avatar",
  );
  assert.ok(headerAvatar);
  assert.ok(organizerAvatar);
  assert.equal(headerAvatar.textContent, "TF");
  assert.equal(headerAvatar.querySelector("img"), null);
  assert.equal(organizerAvatar.textContent, "DA");
  assert.equal(organizerAvatar.querySelector("img"), null);

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
  assert.equal(organizerAvatar.textContent, "DA");
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
