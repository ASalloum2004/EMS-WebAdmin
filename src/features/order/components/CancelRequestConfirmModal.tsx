import { useEffect, useId, useRef } from "react";
import { RejectRequestIcon } from "../../../assets/icons/orderIcons";
import { useI18n } from "../../../i18n";
import "./CancelRequestConfirmModal.scss";

export interface CancelRequestConfirmModalProps {
  error: string;
  isCancelling: boolean;
  itemLabel: string;
  labels: {
    title: string;
    message: string;
    confirm: string;
    cancelling: string;
  };
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}

export function CancelRequestConfirmModal({
  error,
  isCancelling,
  itemLabel,
  labels,
  onCancel,
  onConfirm,
}: CancelRequestConfirmModalProps) {
  const { t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className="cancel-request-confirm-modal" role="presentation">
      <section
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="cancel-request-confirm-modal__dialog"
        role="alertdialog"
      >
        <div className="cancel-request-confirm-modal__icon" aria-hidden="true">
          <RejectRequestIcon size={24} strokeWidth={2} />
        </div>
        <div className="cancel-request-confirm-modal__content">
          <h2 className="cancel-request-confirm-modal__title" id={titleId}>
            {labels.title}
          </h2>
          <p className="cancel-request-confirm-modal__message" id={messageId}>
            {labels.message}
          </p>
          <dl className="cancel-request-confirm-modal__summary">
            <div>
              <dt>{t.order.title}</dt>
              <dd>{itemLabel}</dd>
            </div>
          </dl>
          {error ? <p className="cancel-request-confirm-modal__error" role="alert">{error}</p> : null}
        </div>
        <div className="cancel-request-confirm-modal__actions">
          <button
            className="cancel-request-confirm-modal__button cancel-request-confirm-modal__button--cancel"
            disabled={isCancelling}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="cancel-request-confirm-modal__button cancel-request-confirm-modal__button--confirm"
            disabled={isCancelling}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isCancelling ? labels.cancelling : labels.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
