import { useEffect, useId } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useI18n } from "../../../../i18n";
import type { Announcement } from "../../types";
import "./AnnouncementDeleteDialog.scss";

interface AnnouncementDeleteDialogProps {
  announcement: Announcement;
  error: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AnnouncementDeleteDialog({
  announcement,
  error,
  isPending,
  onCancel,
  onConfirm,
}: AnnouncementDeleteDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const messageId = useId();
  const message = t.announcements.deleteDialog.message.replace(
    "{{title}}",
    announcement.title,
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
    <div className="announcement-delete-dialog">
      <div
        className="announcement-delete-dialog__backdrop"
        onClick={isPending ? undefined : onCancel}
      />
      <section
        className="announcement-delete-dialog__panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
      >
        <span className="announcement-delete-dialog__icon" aria-hidden="true">
          <AlertTriangle size={24} strokeWidth={1.9} />
        </span>
        <div className="announcement-delete-dialog__copy">
          <h2 id={titleId}>{t.announcements.deleteDialog.title}</h2>
          <p id={messageId}>{message}</p>
        </div>
        {error ? (
          <p className="announcement-delete-dialog__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="announcement-delete-dialog__actions">
          <button
            className="announcement-delete-dialog__button announcement-delete-dialog__button--cancel"
            type="button"
            disabled={isPending}
            onClick={onCancel}
          >
            {t.common.cancel}
          </button>
          <button
            className="announcement-delete-dialog__button announcement-delete-dialog__button--confirm"
            type="button"
            disabled={isPending}
            onClick={onConfirm}
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={1.9} />
            {isPending
              ? t.announcements.deleteDialog.deleting
              : t.announcements.deleteDialog.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
