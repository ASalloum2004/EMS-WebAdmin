import {
  ApproveRequestIcon,
  RejectRequestIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import type {
  BoothRequestDetailsApiData,
  BoothRequestStatus,
} from "../../types";

function normalizeBoothRequestStatus(
  status: BoothRequestStatus,
): BoothRequestStatus | null {
  const normalizedStatus = String(status).trim().toLowerCase();

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
  requestDetails,
  t,
}: {
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
        type="button"
      >
        <RejectRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {t.order.details.actions.reject}
      </button>
      <button
        className="booth-request-details-modal__action booth-request-details-modal__action--approve"
        type="button"
      >
        <ApproveRequestIcon aria-hidden="true" size={18} strokeWidth={2} />
        {t.order.details.actions.approve}
      </button>
    </footer>
  );
}
