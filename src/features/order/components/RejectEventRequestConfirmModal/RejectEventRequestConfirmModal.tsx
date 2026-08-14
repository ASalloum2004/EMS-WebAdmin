import { useEffect, useId, useRef } from "react";
import { RejectRequestIcon } from "../../../../assets/icons/orderIcons";
import { useI18n } from "../../../../i18n";
import { getTrimmedString } from "../../utils/getTrimmedString";
import "./RejectEventRequestConfirmModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface RejectEventRequestConfirmModalProps {
  error: string;
  eventTitle: string | null;
  isRejecting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  requestId: number;
}

export function RejectEventRequestConfirmModal({
  error,
  eventTitle,
  isRejecting,
  onCancel,
  onConfirm,
}: RejectEventRequestConfirmModalProps) {
  const { t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const titleId = useId();
  const labels = t.order.eventRequests.rejectConfirmation;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    cancelButtonRef.current?.focus();

    return () => {
      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        if (!isRejecting) {
          onCancel();
        }

        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      event.stopPropagation();

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

      if (!firstFocusableElement || !lastFocusableElement) {
        event.preventDefault();
        dialog.focus();
      } else if (
        event.shiftKey &&
        document.activeElement === firstFocusableElement
      ) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastFocusableElement
      ) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isRejecting, onCancel]);

  useEffect(() => {
    if (!isRejecting && error) {
      cancelButtonRef.current?.focus();
    }
  }, [error, isRejecting]);

  return (
    <div
      className="reject-event-request-confirm-modal"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget && !isRejecting) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isRejecting}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        aria-labelledby={titleId}
        aria-modal="true"
        className="reject-event-request-confirm-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div
          aria-hidden="true"
          className="reject-event-request-confirm-modal__icon"
        >
          <RejectRequestIcon size={24} strokeWidth={2} />
        </div>

        <div className="reject-event-request-confirm-modal__content">
          <h2
            className="reject-event-request-confirm-modal__title"
            id={titleId}
          >
            {labels.title}
          </h2>
          <p
            className="reject-event-request-confirm-modal__message"
            id={descriptionId}
          >
            {labels.message}
          </p>
          <dl className="reject-event-request-confirm-modal__summary">
            <div>
              <dt>{labels.eventLabel}</dt>
              <dd>
                {getTrimmedString(eventTitle) ||
                  t.order.eventRequests.details.notAvailable}
              </dd>
            </div>
          </dl>
          {error ? (
            <p
              className="reject-event-request-confirm-modal__error"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="reject-event-request-confirm-modal__actions">
          <button
            className="reject-event-request-confirm-modal__button reject-event-request-confirm-modal__button--cancel"
            disabled={isRejecting}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="reject-event-request-confirm-modal__button reject-event-request-confirm-modal__button--confirm"
            disabled={isRejecting}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isRejecting ? labels.loading : labels.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
