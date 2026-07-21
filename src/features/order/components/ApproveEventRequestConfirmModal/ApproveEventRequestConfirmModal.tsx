import { useEffect, useId, useRef } from "react";
import { ApproveRequestIcon } from "../../../../assets/icons/orderIcons";
import { useI18n } from "../../../../i18n";
import { getTrimmedString } from "../../utils/getTrimmedString";
import "./ApproveEventRequestConfirmModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ApproveEventRequestConfirmModalProps {
  error: string;
  eventTitle: string | null;
  isApproving: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  requestId: number;
}

export function ApproveEventRequestConfirmModal({
  error,
  eventTitle,
  isApproving,
  onCancel,
  onConfirm,
  requestId,
}: ApproveEventRequestConfirmModalProps) {
  const { t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const titleId = useId();
  const labels = t.order.eventRequests.approveConfirmation;

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

        if (!isApproving) {
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
  }, [isApproving, onCancel]);

  useEffect(() => {
    if (!isApproving && error) {
      cancelButtonRef.current?.focus();
    }
  }, [error, isApproving]);

  return (
    <div
      className="approve-event-request-confirm-modal"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget && !isApproving) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isApproving}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        aria-labelledby={titleId}
        aria-modal="true"
        className="approve-event-request-confirm-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div
          aria-hidden="true"
          className="approve-event-request-confirm-modal__icon"
        >
          <ApproveRequestIcon size={24} strokeWidth={2} />
        </div>

        <div className="approve-event-request-confirm-modal__content">
          <h2
            className="approve-event-request-confirm-modal__title"
            id={titleId}
          >
            {labels.title}
          </h2>
          <p
            className="approve-event-request-confirm-modal__message"
            id={descriptionId}
          >
            {labels.message}
          </p>
          <dl className="approve-event-request-confirm-modal__summary">
            <div>
              <dt>{labels.eventLabel}</dt>
              <dd>
                {getTrimmedString(eventTitle) ||
                  t.order.eventRequests.details.notAvailable}
              </dd>
            </div>
            <div>
              <dt>{labels.requestLabel}</dt>
              <dd>#{requestId}</dd>
            </div>
          </dl>
          {error ? (
            <p
              className="approve-event-request-confirm-modal__error"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="approve-event-request-confirm-modal__actions">
          <button
            className="approve-event-request-confirm-modal__button approve-event-request-confirm-modal__button--cancel"
            disabled={isApproving}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="approve-event-request-confirm-modal__button approve-event-request-confirm-modal__button--confirm"
            disabled={isApproving}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isApproving ? labels.loading : labels.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
