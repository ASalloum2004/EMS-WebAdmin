import {
  ApproveRequestIcon,
  RejectRequestIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";

export function BoothRequestDetailsActions({
  t,
}: {
  t: I18nDictionary;
}) {
  return (
    <footer className="booth-request-details-modal__actions">
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
