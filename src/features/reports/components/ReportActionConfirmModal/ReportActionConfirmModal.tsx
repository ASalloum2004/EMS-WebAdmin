import { useEffect, useId, useRef, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { useI18n } from "../../../../i18n";
import type {
  ReportActionFieldErrors,
  ReportActionPayload,
} from "../../types";
import "./ReportActionConfirmModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export type ReportActionKind = "resolve" | "reject";

interface ReportActionConfirmModalProps {
  action: ReportActionKind;
  error: string;
  fieldErrors: ReportActionFieldErrors;
  isSubmitting: boolean;
  onCancel: () => void;
  onClearErrors: () => void;
  onConfirm: (payload: ReportActionPayload) => Promise<void> | void;
  reportId: number;
}

export function ReportActionConfirmModal({
  action,
  error,
  fieldErrors,
  isSubmitting,
  onCancel,
  onClearErrors,
  onConfirm,
  reportId,
}: ReportActionConfirmModalProps) {
  const { t } = useI18n();
  const [notes, setNotes] = useState("");
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const notesErrorId = useId();
  const notesHelpId = useId();
  const titleId = useId();
  const copy = t.reports.details.actionConfirmation[action];
  const notesDescribedBy = fieldErrors.notes
    ? `${notesHelpId} ${notesErrorId}`
    : notesHelpId;

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

        if (!isSubmitting) {
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
  }, [isSubmitting, onCancel]);

  return (
    <div
      className="report-action-confirm-modal"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
        aria-labelledby={titleId}
        aria-modal="true"
        className="report-action-confirm-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div
          aria-hidden="true"
          className={`report-action-confirm-modal__icon report-action-confirm-modal__icon--${action}`}
        >
          {action === "resolve" ? (
            <CircleCheck size={24} strokeWidth={2} />
          ) : (
            <CircleX size={24} strokeWidth={2} />
          )}
        </div>

        <div className="report-action-confirm-modal__content">
          <h2 className="report-action-confirm-modal__title" id={titleId}>
            {copy.title}
          </h2>
          <p
            className="report-action-confirm-modal__message"
            id={descriptionId}
          >
            {copy.message}
          </p>
          <p className="report-action-confirm-modal__report-id">
            <span>{t.reports.details.actionConfirmation.reportLabel}</span>
            <strong>#{reportId}</strong>
          </p>

          <label className="report-action-confirm-modal__field">
            <span>
              {t.reports.details.actionConfirmation.notesLabel}
            </span>
            <textarea
              aria-describedby={notesDescribedBy}
              aria-invalid={Boolean(fieldErrors.notes)}
              disabled={isSubmitting}
              onChange={(event) => {
                setNotes(event.target.value);
                onClearErrors();
              }}
              placeholder={
                t.reports.details.actionConfirmation.notesPlaceholder
              }
              rows={4}
              value={notes}
            />
          </label>
          <p
            className="report-action-confirm-modal__help"
            id={notesHelpId}
          >
            {t.reports.details.actionConfirmation.notesHelp}
          </p>
          {fieldErrors.notes ? (
            <p
              className="report-action-confirm-modal__error"
              id={notesErrorId}
              role="alert"
            >
              {fieldErrors.notes}
            </p>
          ) : null}
          {error ? (
            <p
              className="report-action-confirm-modal__error"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="report-action-confirm-modal__actions">
          <button
            className={`report-action-confirm-modal__button report-action-confirm-modal__button--cancel${
              action === "reject"
                ? " report-action-confirm-modal__button--cancel-danger"
                : ""
            }`}
            disabled={isSubmitting}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className={`report-action-confirm-modal__button report-action-confirm-modal__button--${action}`}
            disabled={isSubmitting}
            onClick={() =>
              void onConfirm({ notes: notes.trim() || null })
            }
            type="button"
          >
            {isSubmitting ? copy.submitting : copy.confirm}
          </button>
        </div>
      </section>
    </div>
  );
}
