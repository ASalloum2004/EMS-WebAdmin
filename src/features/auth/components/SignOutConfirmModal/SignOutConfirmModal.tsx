import { useEffect } from "react";
import { useI18n } from "../../../../i18n";
import "./SignOutConfirmModal.scss";

interface SignOutConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function SignOutConfirmModal({
  onCancel,
  onConfirm,
}: SignOutConfirmModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="sign-out-confirm-modal">
      <section
        className="sign-out-confirm-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-confirm-modal-title"
        aria-describedby="sign-out-confirm-modal-message"
      >
        <div className="sign-out-confirm-modal__header">
          <h2 id="sign-out-confirm-modal-title">
            {t.auth.signOutConfirmTitle}
          </h2>
          <p id="sign-out-confirm-modal-message">
            {t.auth.signOutConfirmMessage}
          </p>
        </div>

        <div className="sign-out-confirm-modal__actions">
          <button
            className="sign-out-confirm-modal__button sign-out-confirm-modal__button--cancel"
            type="button"
            onClick={onCancel}
          >
            {t.common.cancel}
          </button>
          <button
            className="sign-out-confirm-modal__button sign-out-confirm-modal__button--confirm"
            type="button"
            onClick={onConfirm}
          >
            {t.auth.signOut}
          </button>
        </div>
      </section>
    </div>
  );
}
