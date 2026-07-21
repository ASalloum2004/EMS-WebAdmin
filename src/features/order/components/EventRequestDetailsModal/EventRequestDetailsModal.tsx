import { useEffect, useRef } from "react";
import { useI18n } from "../../../../i18n";
import { EventRequestDetailsFooter } from "./EventRequestDetailsFooter";
import { EventRequestDetailsHeader } from "./EventRequestDetailsHeader";
import type { EventRequestDetailsModalProps } from "./EventRequestDetailsModal.types";
import { EventRequestDetailsStates } from "./EventRequestDetailsStates";
import { EventRequestEngagementSection } from "./EventRequestEngagementSection";
import { EventRequestInformationSection } from "./EventRequestInformationSection";
import { EventRequestOrganizerSection } from "./EventRequestOrganizerSection";
import { EventRequestSpeakersSection } from "./EventRequestSpeakersSection";
import "./EventRequestDetailsModal.scss";

export type { EventRequestDetailsModalProps } from "./EventRequestDetailsModal.types";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function EventRequestDetailsModal({
  details,
  error,
  isLoading,
  onApprove,
  onClose,
  onReject,
  onRetry,
}: EventRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements.at(-1);

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        dialog.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="event-request-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isLoading}
        aria-labelledby="event-request-details-title"
        aria-modal="true"
        className="event-request-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <EventRequestDetailsHeader
          details={details}
          error={error}
          isLoading={isLoading}
          onClose={onClose}
          t={t}
        />

        <div className="event-request-details-modal__scroll-area">
          {details ? (
            <div className="event-request-details-modal__content-grid">
              <div className="event-request-details-modal__column">
                <EventRequestInformationSection
                  details={details}
                  language={language}
                  t={t}
                />
                <EventRequestSpeakersSection
                  speakers={details.speakers}
                  t={t}
                />
              </div>
              <div className="event-request-details-modal__column">
                <EventRequestOrganizerSection
                  organizer={details.eventable}
                  t={t}
                />
                <EventRequestEngagementSection
                  averageRating={details.average_rating}
                  language={language}
                  qrScansCount={details.qr_scans_count}
                  savedCount={details.saved_count}
                  t={t}
                />
              </div>
            </div>
          ) : (
            <EventRequestDetailsStates
              error={error}
              isLoading={isLoading}
              onRetry={onRetry}
              t={t}
            />
          )}
        </div>

        {details ? (
          <EventRequestDetailsFooter
            onApprove={onApprove}
            onReject={onReject}
            status={details.status}
            t={t}
          />
        ) : null}
      </section>
    </div>
  );
}
