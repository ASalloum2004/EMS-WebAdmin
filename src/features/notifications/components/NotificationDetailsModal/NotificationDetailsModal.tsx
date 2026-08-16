import { useEffect, useRef } from "react";
import { Check, Trash2 } from "lucide-react";
import { MarkAllReadIcon } from "../../../../assets/icons/activityIcons";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import { AppLink } from "../../../../router/AppLink";
import {
  formatNotificationDate,
  getNotificationTarget,
  getNotificationTypeLabel,
} from "../../data";
import type { NotificationItem } from "../../types";
import "./NotificationDetailsModal.scss";

interface NotificationDetailsModalProps {
  error: string;
  isDeleteConfirmationOpen: boolean;
  isDeleting: boolean;
  isMarkingAsRead: boolean;
  notification: NotificationItem;
  onClose: () => void;
  onDelete: (notification: NotificationItem) => void;
  onMarkAsRead: (notification: NotificationItem) => void;
}

export function NotificationDetailsModal({
  error,
  isDeleteConfirmationOpen,
  isDeleting,
  isMarkingAsRead,
  notification,
  onClose,
  onDelete,
  onMarkAsRead,
}: NotificationDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const target = getNotificationTarget(notification);
  const targetId =
    notification.targetId === null ? null : String(notification.targetId);
  const isSubmitting =
    isMarkingAsRead || isDeleting || isDeleteConfirmationOpen;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || isSubmitting) {
        return;
      }

      event.preventDefault();
      onClose();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  return (
    <div
      className="notification-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="notification-details-title"
        aria-modal="true"
        className="notification-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="notification-details-modal__header">
          <div>
            <p className="notification-details-modal__eyebrow">
              {t.notifications.details.title}
            </p>
            <h2 id="notification-details-title">{notification.title}</h2>
          </div>
          <ModalCloseButton
            ariaLabel={t.notifications.details.closeAriaLabel}
            disabled={isSubmitting}
            onClick={onClose}
          />
        </header>

        <div className="notification-details-modal__content">
          <dl className="notification-details-modal__metadata">
            <div>
              <dt>{t.notifications.filters.type}</dt>
              <dd>{getNotificationTypeLabel(notification.type, t)}</dd>
            </div>
            <div>
              <dt>{t.notifications.table.status}</dt>
              <dd>
                {t.notifications.notificationStatuses[notification.status]}
              </dd>
            </div>
            <div>
              <dt>{t.notifications.table.date}</dt>
              <dd>{formatNotificationDate(notification.createdAt, language)}</dd>
            </div>
            <div>
              <dt>{t.notifications.details.targetId}</dt>
              <dd>
                {target && targetId ? (
                  <AppLink
                    aria-label={`${t.notifications.details.openTarget}: ${targetId}`}
                    className="notification-details-modal__target-link"
                    href={target.href}
                  >
                    {targetId}
                  </AppLink>
                ) : (
                  targetId ?? t.notifications.details.targetUnavailable
                )}
              </dd>
            </div>
          </dl>

        </div>

        <footer className="notification-details-modal__footer">
          {error ? (
            <p className="notification-details-modal__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className="data-table__action-button notification-details-modal__delete"
            disabled={isSubmitting}
            onClick={() => onDelete(notification)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={17} strokeWidth={2} />
            <span>{t.notifications.actions.delete}</span>
          </button>

          {notification.status === "unread" ? (
            <button
              className="data-table__action-button notification-details-modal__mark-read"
              disabled={isSubmitting}
              onClick={() => onMarkAsRead(notification)}
              type="button"
            >
              <MarkAllReadIcon aria-hidden="true" size={17} strokeWidth={2} />
              <span>{t.notifications.actions.markAsRead}</span>
            </button>
          ) : (
            <p className="notification-details-modal__read-state" role="status">
              <Check aria-hidden="true" size={18} strokeWidth={2} />
              <span>{t.notifications.details.readConfirmation}</span>
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}
