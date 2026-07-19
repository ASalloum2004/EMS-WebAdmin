import {
  ApproveRequestIcon,
  RejectRequestIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import type {
  BoothRequestDetailsApiData,
  BoothRequestStatus,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";

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
  isRejecting,
  onReject,
  rejectError,
  requestDetails,
  t,
}: {
  isRejecting: boolean;
  onReject: (boothRequestId: number) => Promise<unknown> | unknown;
  rejectError: string;
  requestDetails: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  const requestStatus = normalizeBoothRequestStatus(requestDetails.status);

  if (requestStatus === "approved" || requestStatus === "rejected") {
    const isApproved = requestStatus === "approved";
    const statusLabel = t.order.status[requestStatus];

    return (
      <footer className="booth-request-details-modal__actions booth-request-details-modal__actions--final">
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
        disabled={isRejecting}
        onClick={() => void onReject(requestDetails.id)}
        type="button"
      >
        <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {isRejecting
          ? t.order.details.actions.rejecting
          : t.order.details.actions.reject}
      </button>
      <button
        className="booth-request-details-modal__action booth-request-details-modal__action--approve"
        disabled={isRejecting}
        type="button"
      >
        <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {t.order.details.actions.approve}
      </button>
      {rejectError ? (
        <p
          className="booth-request-details-modal__action-error"
          role="alert"
        >
          {rejectError}
        </p>
      ) : null}
    </footer>
  );
}
