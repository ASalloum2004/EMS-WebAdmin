import { useEffect, useId } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useI18n } from "../../../../i18n";
import type { NotificationItem } from "../../types";
import "./NotificationDeleteConfirmModal.scss";

interface NotificationDeleteConfirmModalProps {
  error: string;
  isPending: boolean;
  notification: NotificationItem;
  onCancel: () => void;
  onConfirm: () => void;
}

export function NotificationDeleteConfirmModal({
  error,
  isPending,
  notification,
  onCancel,
  onConfirm,
}: NotificationDeleteConfirmModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const messageId = useId();
  const message = t.notifications.deleteDialog.message.replace(
    "{{title}}",
    notification.title,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPending, onCancel]);

  return (
    <div className="notification-delete-confirm-modal">
      <div
        className="notification-delete-confirm-modal__backdrop"
        onClick={isPending ? undefined : onCancel}
      />
      <section
        aria-describedby={messageId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="notification-delete-confirm-modal__panel"
        role="alertdialog"
      >
        <span
          aria-hidden="true"
          className="notification-delete-confirm-modal__icon"
        >
          <AlertTriangle size={24} strokeWidth={1.9} />
        </span>
        <div className="notification-delete-confirm-modal__copy">
          <h2 id={titleId}>{t.notifications.deleteDialog.title}</h2>
          <p id={messageId}>{message}</p>
        </div>
        {error ? (
          <p className="notification-delete-confirm-modal__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="notification-delete-confirm-modal__actions">
          <button
            className="notification-delete-confirm-modal__button notification-delete-confirm-modal__button--cancel"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="notification-delete-confirm-modal__button notification-delete-confirm-modal__button--confirm"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={1.9} />
            {isPending
              ? t.notifications.deleteDialog.deleting
              : t.notifications.deleteDialog.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
