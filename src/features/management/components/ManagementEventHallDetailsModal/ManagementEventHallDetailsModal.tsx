import { useEffect, useRef } from "react";
import { ModalCloseButton } from "../../../../components";
import { useI18n, type SupportedLanguage } from "../../../../i18n";
import type { EventHallDetails, EventHallEventDetails } from "../../types";
import { EventHallDetailsSkeleton } from "../skeletons";
import "./ManagementEventHallDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ManagementEventHallDetailsModalProps {
  details: EventHallDetails | null;
  error: string;
  eventHallId?: number;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function formatEventHallDateTime(
  value: string,
  language: SupportedLanguage,
  invalidDateLabel: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return invalidDateLabel;
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBackendValue(value: string, fallback: string) {
  const normalizedValue = value.trim().replace(/[_-]+/g, " ");

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue.replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

function getEventTypeLabel(
  type: string,
  workshopLabel: string,
  fallback: string,
) {
  return type.trim().toLowerCase() === "workshop"
    ? workshopLabel
    : formatBackendValue(type, fallback);
}

function getEventStatusLabel(
  status: string,
  labels: {
    approved: string;
    pending: string;
    rejected: string;
  },
  fallback: string,
) {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === "approved" ||
    normalizedStatus === "pending" ||
    normalizedStatus === "rejected"
  ) {
    return labels[normalizedStatus];
  }

  return formatBackendValue(status, fallback);
}

function getStatusClassName(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus === "approved" ||
    normalizedStatus === "pending" ||
    normalizedStatus === "rejected"
    ? `management-event-hall-details__badge--${normalizedStatus}`
    : "management-event-hall-details__badge--neutral";
}

function EventCard({ event }: { event: EventHallEventDetails }) {
  const { language, t } = useI18n();
  const translations = t.management.eventHalls.details;
  const typeLabel = getEventTypeLabel(
    event.type,
    translations.types.workshop,
    translations.unknownValue,
  );
  const statusLabel = getEventStatusLabel(
    event.status,
    translations.statuses,
    translations.unknownValue,
  );
  const durationUnit =
    event.duration === 1 ? translations.hour : translations.hours;

  return (
    <article className="management-event-hall-details__event-card">
      <div className="management-event-hall-details__event-heading">
        <h4>{event.title || translations.unknownValue}</h4>
        <div className="management-event-hall-details__badges">
          <span className="management-event-hall-details__badge management-event-hall-details__badge--type">
            {typeLabel}
          </span>
          <span
            className={`management-event-hall-details__badge ${getStatusClassName(event.status)}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="management-event-hall-details__description">
        <span>{translations.description}</span>
        <p>{event.description || translations.unknownValue}</p>
      </div>

      <dl className="management-event-hall-details__event-grid">
        <div>
          <dt>{translations.startTime}</dt>
          <dd>
            {formatEventHallDateTime(
              event.start_at,
              language,
              translations.invalidDate,
            )}
          </dd>
        </div>
        <div>
          <dt>{translations.endTime}</dt>
          <dd>
            {formatEventHallDateTime(
              event.end_at,
              language,
              translations.invalidDate,
            )}
          </dd>
        </div>
        <div>
          <dt>{translations.duration}</dt>
          <dd>
            {event.duration} {durationUnit}
          </dd>
        </div>
        <div>
          <dt>{translations.createdAt}</dt>
          <dd>
            {formatEventHallDateTime(
              event.created_at,
              language,
              translations.invalidDate,
            )}
          </dd>
        </div>
        <div>
          <dt>{translations.type}</dt>
          <dd>{typeLabel}</dd>
        </div>
        <div>
          <dt>{translations.status}</dt>
          <dd>{statusLabel}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ManagementEventHallDetailsModal({
  details,
  error,
  isLoading,
  onClose,
  onRetry,
}: ManagementEventHallDetailsModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const translations = t.management.eventHalls.details;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

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
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="management-event-hall-details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isLoading}
        aria-labelledby="event-hall-details-title"
        aria-modal="true"
        className="management-event-hall-details__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="management-event-hall-details__header">
          <div className="management-event-hall-details__header-copy">
            <h2 id="event-hall-details-title">{translations.title}</h2>
            {details ? (
              <p>
                {t.management.eventHalls.number}: {details.number}
              </p>
            ) : null}
          </div>
          <ModalCloseButton
            ariaLabel={translations.closeAriaLabel}
            className="management-event-hall-details__close"
            onClick={onClose}
          />
        </header>

        <div className="management-event-hall-details__scroll-area">
          {isLoading && !details ? (
            <EventHallDetailsSkeleton />
          ) : !details ? (
            <div
              aria-live="polite"
              className="management-event-hall-details__state"
              role={error ? "alert" : "status"}
            >
              <p>
                {error || translations.errorFallback}
              </p>
              {error ? (
                <button type="button" onClick={onRetry}>
                  {t.common.tryAgain}
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <section
                aria-labelledby="event-hall-summary-title"
                className="management-event-hall-details__section"
              >
                <h3 id="event-hall-summary-title">
                  {translations.information}
                </h3>
                <dl className="management-event-hall-details__summary-grid">
                  <div>
                    <dt>{t.management.eventHalls.number}</dt>
                    <dd>{details.number}</dd>
                  </div>
                  <div>
                    <dt>{t.management.eventHalls.area}</dt>
                    <dd>{details.area}</dd>
                  </div>
                  <div>
                    <dt>{t.management.eventHalls.pricePerHour}</dt>
                    <dd>{details.price_per_hour}</dd>
                  </div>
                </dl>
              </section>

              <section
                aria-labelledby="event-hall-events-title"
                className="management-event-hall-details__section"
              >
                <div className="management-event-hall-details__section-heading">
                  <h3 id="event-hall-events-title">
                    {translations.scheduledEvents}
                  </h3>
                  <span>
                    {translations.eventCount}: {details.events.length}
                  </span>
                </div>

                {details.events.length ? (
                  <div className="management-event-hall-details__events">
                    {details.events.map((event) => (
                      <EventCard event={event} key={event.id} />
                    ))}
                  </div>
                ) : (
                  <div className="management-event-hall-details__empty-events">
                    <p>{translations.noScheduledEvents}</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
