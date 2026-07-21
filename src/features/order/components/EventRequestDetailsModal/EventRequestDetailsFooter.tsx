import {
  ApproveRequestIcon,
  RejectRequestIcon,
} from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import type { EventRequestDetailsFooterProps } from "./EventRequestDetailsModal.types";
import {
  classNames,
  getStatusLabel,
  getStatusModifier,
} from "./EventRequestDetailsModal.utils";

export function EventRequestDetailsFooter({
  approveButtonRef,
  isApproving,
  isRejecting,
  onApprove,
  onReject,
  rejectButtonRef,
  status,
  t,
}: EventRequestDetailsFooterProps) {
  const normalizedStatus = getTrimmedString(status).toLowerCase();
  const labels = t.order.eventRequests.details;

  if (normalizedStatus === "pending") {
    return (
      <footer className="event-request-details-modal__actions event-request-details-modal__actions--pending">
        <button
          className="event-request-details-modal__action event-request-details-modal__action--reject"
          disabled={isApproving || isRejecting}
          onClick={onReject}
          ref={rejectButtonRef}
          type="button"
        >
          <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          {labels.reject}
        </button>
        <button
          className="event-request-details-modal__action event-request-details-modal__action--approve"
          disabled={isApproving || isRejecting}
          onClick={onApprove}
          ref={approveButtonRef}
          type="button"
        >
          <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          {labels.approve}
        </button>
      </footer>
    );
  }

  const statusLabel = getStatusLabel(status, t);
  const statusModifier = getStatusModifier(status);

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
