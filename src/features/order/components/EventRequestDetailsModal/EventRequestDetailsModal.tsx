import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ApproveRequestIcon,
  CompanyIcon,
  ContactIcon,
  GalleryIcon,
  NotesIcon,
  RejectRequestIcon,
  RequestOverviewIcon,
  TotalRequestsIcon,
} from "../../../../assets/icons/orderIcons";
import { Card, ModalCloseButton } from "../../../../components";
import type { I18nDictionary, SupportedLanguage } from "../../../../i18n";
import { useI18n } from "../../../../i18n";
import type {
  EventRequestDetails,
  EventRequestOrganizerDetails,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import {
  formatEventRequestCreatedDate,
  formatEventRequestDateTime,
} from "../eventRequestTableColumns";
import "./EventRequestDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

const knownEventTypes = ["conference", "lecture", "workshop", "other"] as const;
const knownStatuses = ["approved", "pending", "rejected"] as const;

type KnownEventType = (typeof knownEventTypes)[number];
type KnownStatus = (typeof knownStatuses)[number];

export interface EventRequestDetailsModalProps {
  details: EventRequestDetails | null;
  error: string;
  isLoading: boolean;
  onApprove?: () => void;
  onClose: () => void;
  onReject?: () => void;
  onRetry: () => void;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isKnownEventType(value: string): value is KnownEventType {
  return knownEventTypes.some((knownType) => knownType === value);
}

function isKnownStatus(value: string): value is KnownStatus {
  return knownStatuses.some((knownStatus) => knownStatus === value);
}

function formatBackendValue(value: unknown, fallback: string) {
  const normalizedValue = getTrimmedString(value).replace(/[_-]+/g, " ");

  if (!normalizedValue) {
    return fallback;
  }

  return normalizedValue.replace(/\b\w/g, (character) =>
    character.toUpperCase(),
  );
}

function getTypeLabel(value: unknown, t: I18nDictionary) {
  const normalizedType = getTrimmedString(value).toLowerCase();

  return isKnownEventType(normalizedType)
    ? t.order.eventRequests.table.types[normalizedType]
    : formatBackendValue(value, t.order.eventRequests.details.notAvailable);
}

function getStatusLabel(value: unknown, t: I18nDictionary) {
  const normalizedStatus = getTrimmedString(value).toLowerCase();

  return isKnownStatus(normalizedStatus)
    ? t.order.status[normalizedStatus]
    : formatBackendValue(value, t.order.eventRequests.details.unknownStatus);
}

function getStatusModifier(value: unknown) {
  const normalizedStatus = getTrimmedString(value).toLowerCase();

  return isKnownStatus(normalizedStatus) ? normalizedStatus : "unknown";
}

function getSafeExternalUrl(value: unknown) {
  const normalizedValue = getTrimmedString(value);

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getSafeTelephoneUrl(value: unknown) {
  const phone = getTrimmedString(value);

  if (!phone || !/^[+\d][\d\s().-]*$/.test(phone)) {
    return null;
  }

  const normalizedPhone = phone.replace(/[^+\d]/g, "");

  return normalizedPhone ? `tel:${normalizedPhone}` : null;
}

function getInitials(value: unknown) {
  const initials = getTrimmedString(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "—";
}

function formatDateTime(
  value: string | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  return value
    ? formatEventRequestDateTime(
        value,
        language,
        t.order.eventRequests.details.invalidDate,
      )
    : t.order.eventRequests.details.notAvailable;
}

function formatCreatedDate(
  value: string | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  return value
    ? formatEventRequestCreatedDate(
        value,
        language,
        t.order.eventRequests.details.invalidDate,
      )
    : t.order.eventRequests.details.notAvailable;
}

function formatDuration(
  duration: number | null,
  language: SupportedLanguage,
  t: I18nDictionary,
) {
  if (duration === null || !Number.isFinite(duration)) {
    return t.order.eventRequests.details.notAvailable;
  }

  const formattedDuration = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
  ).format(duration);
  const unit =
    duration === 1
      ? t.order.eventRequests.details.hour
      : t.order.eventRequests.details.hours;

  return `${formattedDuration} ${unit}`;
}

function formatNumber(
  value: number | null,
  language: SupportedLanguage,
  fallback: string,
  maximumFractionDigits = 0,
) {
  if (value === null || !Number.isFinite(value)) {
    return fallback;
  }

  return new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
    maximumFractionDigits,
  }).format(value);
}

function EventLogo({
  className,
  logo,
  title,
  t,
}: {
  className?: string;
  logo: string | null;
  title: string | null;
  t: I18nDictionary;
}) {
  const logoUrl = getSafeExternalUrl(logo);
  const [hasImageError, setHasImageError] = useState(false);
  const eventTitle =
    getTrimmedString(title) || t.order.eventRequests.details.title;
  const altText = `${t.order.eventRequests.details.logoAlt}: ${eventTitle}`;

  useEffect(() => {
    setHasImageError(false);
  }, [eventTitle, logoUrl]);

  return (
    <span
      className={classNames(
        "event-request-details-modal__logo",
        className,
      )}
    >
      {logoUrl && !hasImageError ? (
        <img
          alt={altText}
          onError={() => setHasImageError(true)}
          src={logoUrl}
        />
      ) : (
        <span aria-label={altText}>{getInitials(eventTitle)}</span>
      )}
    </span>
  );
}

function DetailsCard({
  children,
  className,
  icon,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card
      bodyClassName="event-request-details-modal__card-body"
      className={classNames("event-request-details-modal__card", className)}
      headerClassName="event-request-details-modal__card-header"
      icon={icon}
      iconClassName="event-request-details-modal__card-icon"
      title={title}
      titleClassName="event-request-details-modal__card-title"
    >
      {children}
    </Card>
  );
}

function EventInformation({
  details,
  language,
  t,
}: {
  details: EventRequestDetails;
  language: SupportedLanguage;
  t: I18nDictionary;
}) {
  const labels = t.order.eventRequests.details;

  return (
    <DetailsCard
      icon={<RequestOverviewIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.eventInformation}
    >
      <dl className="event-request-details-modal__facts">
        <div>
          <dt>{labels.eventHall}</dt>
          <dd>
            {details.event_hall_id === null
              ? labels.notAvailable
              : `#${details.event_hall_id}`}
          </dd>
        </div>
        <div>
          <dt>{labels.startTime}</dt>
          <dd>{formatDateTime(details.start_at, language, t)}</dd>
        </div>
        <div>
          <dt>{labels.endTime}</dt>
          <dd>{formatDateTime(details.end_at, language, t)}</dd>
        </div>
        <div>
          <dt>{labels.duration}</dt>
          <dd>{formatDuration(details.duration, language, t)}</dd>
        </div>
        <div>
          <dt>{labels.createdAt}</dt>
          <dd>{formatCreatedDate(details.created_at, language, t)}</dd>
        </div>
      </dl>
    </DetailsCard>
  );
}

function EventDescription({
  details,
  t,
}: {
  details: EventRequestDetails;
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      icon={<NotesIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.eventRequests.details.description}
    >
      <p className="event-request-details-modal__description">
        {getTrimmedString(details.description) ||
          t.order.eventRequests.details.notAvailable}
      </p>
    </DetailsCard>
  );
}

function OrganizerLink({
  href,
  label,
  unavailable,
}: {
  href: string | null;
  label: string;
  unavailable: string;
}) {
  return (
    <div className="event-request-details-modal__organizer-link">
      <span>{label}</span>
      {href ? (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </a>
      ) : (
        <strong>{unavailable}</strong>
      )}
    </div>
  );
}

function OrganizerInformation({
  organizer,
  t,
}: {
  organizer: EventRequestOrganizerDetails | null;
  t: I18nDictionary;
}) {
  const labels = t.order.eventRequests.details;

  if (!organizer) {
    return (
      <DetailsCard
        icon={<CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
        title={labels.organizerInformation}
      >
        <p className="event-request-details-modal__empty">
          {labels.noOrganizer}
        </p>
      </DetailsCard>
    );
  }

  const phone = getTrimmedString(organizer.phone);
  const phoneUrl = getSafeTelephoneUrl(phone);
  const website = getSafeExternalUrl(organizer.social_links?.website);
  const linkedin = getSafeExternalUrl(organizer.social_links?.linkedin);
  const companyStatus = getStatusLabel(organizer.status, t);

  return (
    <DetailsCard
      icon={<CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.organizerInformation}
    >
      <div className="event-request-details-modal__organizer-heading">
        <span aria-hidden="true" className="event-request-details-modal__organizer-avatar">
          {getInitials(organizer.name)}
        </span>
        <span>
          <small>{labels.companyName}</small>
          <strong>{getTrimmedString(organizer.name) || labels.notAvailable}</strong>
        </span>
        <span
          aria-label={`${labels.companyStatus}: ${companyStatus}`}
          className={classNames(
            "event-request-details-modal__company-status",
            `event-request-details-modal__company-status--${getStatusModifier(
              organizer.status,
            )}`,
          )}
        >
          {companyStatus}
        </span>
      </div>

      <dl className="event-request-details-modal__organizer-facts">
        <div>
          <dt>{labels.companyId}</dt>
          <dd>#{organizer.id}</dd>
        </div>
        <div>
          <dt>{labels.businessSector}</dt>
          <dd>{getTrimmedString(organizer.business_sector) || labels.notAvailable}</dd>
        </div>
        <div>
          <dt>{labels.phone}</dt>
          <dd>
            {phone && phoneUrl ? (
              <a dir="ltr" href={phoneUrl}>{phone}</a>
            ) : (
              phone || labels.notAvailable
            )}
          </dd>
        </div>
        <div>
          <dt>{labels.yearFounded}</dt>
          <dd>{organizer.year_founded ?? labels.notAvailable}</dd>
        </div>
        <div>
          <dt>{labels.companyStatus}</dt>
          <dd>{companyStatus}</dd>
        </div>
      </dl>

      <div className="event-request-details-modal__organizer-description">
        <strong>{labels.companyDescription}</strong>
        <p>{getTrimmedString(organizer.description) || labels.notAvailable}</p>
      </div>

      <div className="event-request-details-modal__organizer-links">
        <OrganizerLink
          href={website}
          label={labels.website}
          unavailable={labels.notAvailable}
        />
        <OrganizerLink
          href={linkedin}
          label={labels.linkedin}
          unavailable={labels.notAvailable}
        />
      </div>
    </DetailsCard>
  );
}

function Speakers({
  details,
  t,
}: {
  details: EventRequestDetails;
  t: I18nDictionary;
}) {
  const labels = t.order.eventRequests.details;

  return (
    <DetailsCard
      icon={<ContactIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.speakers}
    >
      {details.speakers.length ? (
        <ul className="event-request-details-modal__speakers">
          {details.speakers.map((speaker) => (
            <li key={speaker.id}>
              <span aria-hidden="true">{getInitials(speaker.name)}</span>
              <span>
                <strong>{getTrimmedString(speaker.name) || labels.notAvailable}</strong>
                <small>{labels.speakerId} #{speaker.id}</small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="event-request-details-modal__empty">
          {labels.noSpeakers}
        </p>
      )}
    </DetailsCard>
  );
}

function Engagement({
  details,
  language,
  t,
}: {
  details: EventRequestDetails;
  language: SupportedLanguage;
  t: I18nDictionary;
}) {
  const labels = t.order.eventRequests.details;

  return (
    <DetailsCard
      icon={<TotalRequestsIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.engagement}
    >
      <dl className="event-request-details-modal__engagement">
        <div>
          <dt>{labels.averageRating}</dt>
          <dd>
            {details.average_rating === null
              ? labels.notRatedYet
              : formatNumber(details.average_rating, language, labels.notRatedYet, 1)}
          </dd>
        </div>
        <div>
          <dt>{labels.qrScans}</dt>
          <dd>{formatNumber(details.qr_scans_count, language, labels.notAvailable)}</dd>
        </div>
        <div>
          <dt>{labels.savedCount}</dt>
          <dd>{formatNumber(details.saved_count, language, labels.notAvailable)}</dd>
        </div>
      </dl>
    </DetailsCard>
  );
}

function AdditionalInformation({
  details,
  t,
}: {
  details: EventRequestDetails;
  t: I18nDictionary;
}) {
  const labels = t.order.eventRequests.details;

  return (
    <DetailsCard
      icon={<GalleryIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.additionalInformation}
    >
      <dl className="event-request-details-modal__additional">
        <div>
          <dt>{labels.qrToken}</dt>
          <dd className="event-request-details-modal__qr-token">
            {getTrimmedString(details.qr_token) || labels.notAvailable}
          </dd>
        </div>
        <div>
          <dt>{labels.eventLogo}</dt>
          <dd>
            <EventLogo
              className="event-request-details-modal__logo--compact"
              logo={details.logo}
              t={t}
              title={details.title}
            />
          </dd>
        </div>
      </dl>
    </DetailsCard>
  );
}

function EventRequestDetailsActions({
  details,
  onApprove,
  onReject,
  t,
}: {
  details: EventRequestDetails;
  onApprove?: () => void;
  onReject?: () => void;
  t: I18nDictionary;
}) {
  const normalizedStatus = getTrimmedString(details.status).toLowerCase();
  const labels = t.order.eventRequests.details;

  if (normalizedStatus === "pending") {
    return (
      <footer className="event-request-details-modal__actions event-request-details-modal__actions--pending">
        <button
          className="event-request-details-modal__action event-request-details-modal__action--reject"
          onClick={onReject}
          type="button"
        >
          <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          {labels.reject}
        </button>
        <button
          className="event-request-details-modal__action event-request-details-modal__action--approve"
          onClick={onApprove}
          type="button"
        >
          <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          {labels.approve}
        </button>
      </footer>
    );
  }

  const statusLabel = getStatusLabel(details.status, t);
  const statusModifier = getStatusModifier(details.status);

  return (
    <footer className="event-request-details-modal__actions">
      <div
        aria-disabled="true"
        aria-label={statusLabel}
        className={classNames(
          "event-request-details-modal__final-status",
          `event-request-details-modal__final-status--${statusModifier}`,
        )}
        role="status"
      >
        {statusModifier === "approved" ? (
          <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        ) : statusModifier === "rejected" ? (
          <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        ) : null}
        {statusLabel}
      </div>
    </footer>
  );
}

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
  const labels = t.order.eventRequests.details;
  const eventTitle = getTrimmedString(details?.title) || labels.title;
  const typeLabel = details ? getTypeLabel(details.type, t) : "";
  const statusLabel = details ? getStatusLabel(details.status, t) : "";

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
        <header className="event-request-details-modal__header">
          <EventLogo
            className="event-request-details-modal__logo--header"
            logo={details?.logo ?? null}
            t={t}
            title={details?.title ?? null}
          />
          <div className="event-request-details-modal__header-copy">
            <h2 id="event-request-details-title">{eventTitle}</h2>
            {details ? (
              <div className="event-request-details-modal__header-badges">
                <span className="event-request-details-modal__request-badge">
                  {t.order.eventRequests.table.requestPrefix} #{details.id}
                </span>
                <span className="event-request-details-modal__type-badge">
                  {typeLabel}
                </span>
                <span
                  aria-label={`${labels.status}: ${statusLabel}`}
                  className={classNames(
                    "event-request-details-modal__status",
                    `event-request-details-modal__status--${getStatusModifier(
                      details.status,
                    )}`,
                  )}
                >
                  {statusLabel}
                </span>
              </div>
            ) : (
              <p>{isLoading ? labels.loading : error || labels.loadError}</p>
            )}
          </div>
          <ModalCloseButton
            ariaLabel={labels.closeAriaLabel}
            className="event-request-details-modal__close"
            onClick={onClose}
          />
        </header>

        <div className="event-request-details-modal__scroll-area">
          {details ? (
            <div className="event-request-details-modal__content-grid">
              <div className="event-request-details-modal__column">
                <EventInformation details={details} language={language} t={t} />
                <EventDescription details={details} t={t} />
                <Speakers details={details} t={t} />
              </div>
              <div className="event-request-details-modal__column">
                <OrganizerInformation organizer={details.eventable} t={t} />
                <Engagement details={details} language={language} t={t} />
                <AdditionalInformation details={details} t={t} />
              </div>
            </div>
          ) : (
            <div
              aria-live="polite"
              className="event-request-details-modal__request-state"
              role={error ? "alert" : "status"}
            >
              <p>{isLoading ? labels.loading : error || labels.loadError}</p>
              {error ? (
                <button onClick={onRetry} type="button">
                  {t.common.tryAgain}
                </button>
              ) : null}
            </div>
          )}
        </div>

        {details ? (
          <EventRequestDetailsActions
            details={details}
            onApprove={onApprove}
            onReject={onReject}
            t={t}
          />
        ) : null}
      </section>
    </div>
  );
}
