import {
  ApproveRequestIcon,
  RejectRequestIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import type { Ref } from "react";
import type {
  BoothRequestDetailsApiData,
  BoothRequestStatus,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import "./BoothRequestDetailsActions.scss";

function normalizeBoothRequestStatus(
  status: BoothRequestStatus,
): BoothRequestStatus | null {
  const normalizedStatus = getTrimmedString(status).toLowerCase();

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rejected"
  ) {
    return normalizedStatus;
  }

  return null;
}

export function BoothRequestDetailsActions({
  approveButtonRef,
  isApproving,
  isRejecting,
  isCancelling,
  onCancelClick,
  onApproveClick,
  onRejectClick,
  rejectButtonRef,
  requestDetails,
  t,
}: {
  approveButtonRef?: Ref<HTMLButtonElement>;
  isApproving: boolean;
  isRejecting: boolean;
  isCancelling: boolean;
  onCancelClick: () => void;
  onApproveClick: () => void;
  onRejectClick: () => void;
  rejectButtonRef?: Ref<HTMLButtonElement>;
  requestDetails: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  const requestStatus = normalizeBoothRequestStatus(requestDetails.status);

  if (requestStatus === "approved" || requestStatus === "rejected") {
    const isApproved = requestStatus === "approved";
    const statusLabel = t.order.status[requestStatus];

    return (
      <footer className="booth-request-details-modal__actions booth-request-details-modal__actions--final">
        {isApproved ? (
          <button
            className="booth-request-details-modal__action booth-request-details-modal__action--cancel"
            disabled={isCancelling}
            onClick={onCancelClick}
            type="button"
          >
            {t.order.cancelConfirmation.confirm}
          </button>
        ) : null}
        <div
          aria-disabled="true"
          aria-label={statusLabel}
          className={`booth-request-details-modal__action booth-request-details-modal__action--state booth-request-details-modal__action--state-${requestStatus}`}
          role="status"
        >
          {isApproved ? (
            <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          ) : (
            <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
          )}
          {statusLabel}
        </div>
      </footer>
    );
  }

  if (requestStatus !== "pending") {
    return null;
  }

  return (
    <footer className="booth-request-details-modal__actions booth-request-details-modal__actions--pending">
      <button
        className="booth-request-details-modal__action booth-request-details-modal__action--reject"
        disabled={isRejecting || isApproving}
        onClick={onRejectClick}
        ref={rejectButtonRef}
        type="button"
      >
        <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {isRejecting
          ? t.order.details.actions.rejecting
          : t.order.details.actions.reject}
      </button>
      <button
        className="booth-request-details-modal__action booth-request-details-modal__action--approve"
        disabled={isRejecting || isApproving}
        onClick={onApproveClick}
        ref={approveButtonRef}
        type="button"
      >
        <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {isApproving
          ? t.order.approveConfirmation.approving
          : t.order.details.actions.approve}
      </button>
    </footer>
  );
}
