import { ModalCloseButton } from "../../../../components";
import { getTrimmedString } from "../../utils/getTrimmedString";
import type { EventRequestDetailsHeaderProps } from "./EventRequestDetailsModal.types";
import {
  classNames,
  getStatusLabel,
  getStatusModifier,
  getTypeLabel,
} from "./EventRequestDetailsModal.utils";
import { EventRequestDetailsLogo } from "./EventRequestDetailsLogo";

export function EventRequestDetailsHeader({
  details,
  error,
  isLoading,
  onClose,
  t,
}: EventRequestDetailsHeaderProps) {
  const labels = t.order.eventRequests.details;
  const eventTitle = getTrimmedString(details?.title) || labels.title;
  const typeLabel = details ? getTypeLabel(details.type, t) : "";
  const statusLabel = details ? getStatusLabel(details.status, t) : "";

  return (
    <header className="event-request-details-modal__header">
      <EventRequestDetailsLogo
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
  );
}
