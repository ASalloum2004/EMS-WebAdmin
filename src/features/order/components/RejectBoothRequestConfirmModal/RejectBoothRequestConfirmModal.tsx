import { useEffect, useId, useRef } from "react";
import { RejectRequestIcon } from "../../../../assets/icons/orderIcons";
import { useI18n } from "../../../../i18n";
import "./RejectBoothRequestConfirmModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface RejectBoothRequestConfirmModalProps {
  error: string;
  isRejecting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  requestId: number;
}

export function RejectBoothRequestConfirmModal({
  error,
  isRejecting,
  onCancel,
  onConfirm,
  requestId,
}: RejectBoothRequestConfirmModalProps) {
  const { t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const isRejectingRef = useRef(isRejecting);
  const isSubmittingRef = useRef(false);
  const wasRejectingRef = useRef(isRejecting);
  const descriptionId = useId();
  const errorId = useId();
  const titleId = useId();

  isRejectingRef.current = isRejecting;

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const dialog = dialogRef.current;

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        if (!isRejectingRef.current) {
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
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
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

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);

      if (previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, [onCancel]);

  useEffect(() => {
    if (wasRejectingRef.current && !isRejecting && error) {
      cancelButtonRef.current?.focus();
    }

    wasRejectingRef.current = isRejecting;
  }, [error, isRejecting]);

  async function handleConfirm() {
    if (isRejecting || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    try {
      await onConfirm();
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <div
      className="reject-booth-request-confirm-modal"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget && !isRejecting) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        aria-labelledby={titleId}
        aria-modal="true"
        className="reject-booth-request-confirm-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div
          aria-hidden="true"
          className="reject-booth-request-confirm-modal__icon"
        >
          <RejectRequestIcon size={24} strokeWidth={2} />
        </div>

        <div className="reject-booth-request-confirm-modal__content">
          <h2
            className="reject-booth-request-confirm-modal__title"
            id={titleId}
          >
            {t.order.rejectConfirmation.title}
          </h2>
          <p
            className="reject-booth-request-confirm-modal__message"
            id={descriptionId}
          >
            {t.order.rejectConfirmation.message}
          </p>
          <p className="reject-booth-request-confirm-modal__request-id">
            <span>{t.order.rejectConfirmation.requestLabel}</span>
            <strong>#{requestId}</strong>
          </p>
          {error ? (
            <p
              className="reject-booth-request-confirm-modal__error"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="reject-booth-request-confirm-modal__actions">
          <button
            className="reject-booth-request-confirm-modal__button reject-booth-request-confirm-modal__button--cancel"
            disabled={isRejecting}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="reject-booth-request-confirm-modal__button reject-booth-request-confirm-modal__button--confirm"
            disabled={isRejecting}
            onClick={() => void handleConfirm()}
            type="button"
          >
            {isRejecting
              ? t.order.rejectConfirmation.rejecting
              : t.order.rejectConfirmation.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
