import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { ModalCloseButton, Skeleton } from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import type {
  ReportActionFieldErrors,
  ReportActionPayload,
  ReportActionResponse,
  ReportDetails,
  ReportStatus,
} from "../../types";
import {
  ReportActionConfirmModal,
  type ReportActionKind,
} from "../ReportActionConfirmModal";
import "./ReportDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ReportDetailsModalProps = {
  details: ReportDetails | null;
  error: string;
  isRejecting: boolean;
  isResolving: boolean;
  isLoading: boolean;
  onClearRejectError: () => void;
  onClearResolveError: () => void;
  onClose: () => void;
  onReject: (
    reportId: number,
    payload: ReportActionPayload,
  ) => Promise<ReportActionResponse | null>;
  onResolve: (
    reportId: number,
    payload: ReportActionPayload,
  ) => Promise<ReportActionResponse | null>;
  onRetry: () => void;
  rejectError: string;
  rejectFieldErrors: ReportActionFieldErrors;
  reportId: number;
  resolveError: string;
  resolveFieldErrors: ReportActionFieldErrors;
};

export function formatReportDetailsDate(
  value: string,
  language: SupportedLanguage,
  invalidDateLabel: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return invalidDateLabel;
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDisplayValue(value: string | null, fallback: string) {
  const normalizedValue = value?.trim();

  return normalizedValue || fallback;
}

function ReportDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <div className="report-details-modal__skeleton">
      <span className="skeleton__loading-message" role="status">
        {t.reports.details.loading}
      </span>
      <section className="report-details-modal__section" aria-hidden="true">
        <Skeleton height={22} width={156} />
        <div className="report-details-modal__information-grid">
          {[96, 128, 88, 142].map((width) => (
            <div key={width}>
              <Skeleton height={12} width={72} />
              <Skeleton height={18} width={width} />
            </div>
          ))}
        </div>
      </section>
      <section className="report-details-modal__section" aria-hidden="true">
        <Skeleton height={22} width={118} />
        <Skeleton height={16} width="92%" />
        <Skeleton height={16} width="76%" />
      </section>
    </div>
  );
}

function ReportStatusBadge({
  status,
  t,
}: {
  status: ReportStatus;
  t: I18nDictionary;
}) {
  return (
    <span
      className={`report-details-modal__status report-details-modal__status--${status}`}
    >
      {t.reports.reportStatuses[status]}
    </span>
  );
}

function ReportDetailsFooter({
  details,
  isRejecting,
  isResolving,
  onRejectClick,
  onResolveClick,
}: {
  details: ReportDetails | null;
  isRejecting: boolean;
  isResolving: boolean;
  onRejectClick: () => void;
  onResolveClick: () => void;
}) {
  const { t } = useI18n();

  if (!details) {
    return null;
  }

  if (details.status === "pending") {
    return (
      <footer className="report-details-modal__footer report-details-modal__footer--pending">
        <button
          className="report-details-modal__action report-details-modal__action--reject"
          disabled={isRejecting || isResolving}
          onClick={onRejectClick}
          type="button"
        >
          <CircleX aria-hidden="true" size={18} strokeWidth={2} />
          {isRejecting
            ? t.reports.details.actionConfirmation.reject.submitting
            : t.reports.details.reject}
        </button>
        <button
          className="report-details-modal__action report-details-modal__action--approve"
          disabled={isRejecting || isResolving}
          onClick={onResolveClick}
          type="button"
        >
          <CircleCheck aria-hidden="true" size={18} strokeWidth={2} />
          {isResolving
            ? t.reports.details.actionConfirmation.resolve.submitting
            : t.reports.details.approve}
        </button>
      </footer>
    );
  }

  const isResolved = details.status === "resolved";
  const statusLabel = t.reports.reportStatuses[details.status];

  return (
    <footer className="report-details-modal__footer">
      <span className="report-details-modal__final-label">
        {t.reports.details.finalStatus}
      </span>
      <div
        className={`report-details-modal__final-status report-details-modal__final-status--${details.status}`}
        role="status"
      >
        {isResolved ? (
          <CircleCheck aria-hidden="true" size={18} strokeWidth={2} />
        ) : (
          <CircleX aria-hidden="true" size={18} strokeWidth={2} />
        )}
        {statusLabel}
      </div>
    </footer>
  );
}

export function ReportDetailsModal({
  details,
  error,
  isRejecting,
  isResolving,
  isLoading,
  onClearRejectError,
  onClearResolveError,
  onClose,
  onReject,
  onResolve,
  onRetry,
  rejectError,
  rejectFieldErrors,
  resolveError,
  resolveFieldErrors,
}: ReportDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const [confirmationAction, setConfirmationAction] =
    useState<ReportActionKind | null>(null);
  const [confirmationReportId, setConfirmationReportId] = useState<
    number | null
  >(null);
  const isSubmitting = isRejecting || isResolving;
  const isConfirmationVisible = Boolean(
    confirmationAction &&
      details?.status === "pending" &&
      details.id === confirmationReportId,
  );

  const clearActionError = useCallback(
    (action: ReportActionKind) => {
      if (action === "resolve") {
        onClearResolveError();
      } else {
        onClearRejectError();
      }
    },
    [onClearRejectError, onClearResolveError],
  );

  const closeConfirmation = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    if (confirmationAction) {
      clearActionError(confirmationAction);
    }

    setConfirmationAction(null);
    setConfirmationReportId(null);
  }, [clearActionError, confirmationAction, isSubmitting]);

  const openConfirmation = useCallback(
    (action: ReportActionKind) => {
      if (!details || details.status !== "pending" || isSubmitting) {
        return;
      }

      clearActionError(action);
      setConfirmationAction(action);
      setConfirmationReportId(details.id);
    },
    [clearActionError, details, isSubmitting],
  );

  const confirmAction = useCallback(
    async (payload: ReportActionPayload) => {
      if (
        !confirmationAction ||
        !details ||
        details.status !== "pending" ||
        details.id !== confirmationReportId ||
        isSubmitting
      ) {
        return;
      }

      const response =
        confirmationAction === "resolve"
          ? await onResolve(details.id, payload)
          : await onReject(details.id, payload);

      if (response) {
        setConfirmationAction(null);
        setConfirmationReportId(null);
      }
    },
    [
      confirmationAction,
      confirmationReportId,
      details,
      isSubmitting,
      onReject,
      onResolve,
    ],
  );

  useEffect(() => {
    setConfirmationAction(null);
    setConfirmationReportId(null);
  }, [details?.id]);

  useEffect(() => {
    if (details?.status !== "pending") {
      setConfirmationAction(null);
      setConfirmationReportId(null);
    }
  }, [details?.status]);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    function handleKeyDown(event: KeyboardEvent) {
      if (isConfirmationVisible) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

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

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmationVisible, onClose]);

  return (
    <>
      <div
        className="report-details-modal"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !isConfirmationVisible
          ) {
            onClose();
          }
        }}
        role="presentation"
      >
        <section
          aria-busy={isLoading}
          aria-hidden={isConfirmationVisible ? true : undefined}
          aria-labelledby="report-details-title"
          aria-modal="true"
          className="report-details-modal__dialog"
          inert={isConfirmationVisible ? true : undefined}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
        <header className="report-details-modal__header">
          <div className="report-details-modal__heading">
            <h2 id="report-details-title">{t.reports.details.title}</h2>
            {details ? <p>{details.title}</p> : null}
          </div>
          {details ? (
            <ReportStatusBadge status={details.status} t={t} />
          ) : null}
          <ModalCloseButton
            ariaLabel={t.reports.details.closeAriaLabel}
            className="report-details-modal__close"
            onClick={onClose}
          />
        </header>

        <div className="report-details-modal__scroll-area">
          {isLoading && !details ? (
            <ReportDetailsSkeleton />
          ) : !details ? (
            <div
              aria-live="polite"
              className="report-details-modal__state"
              role={error ? "alert" : "status"}
            >
              <p>{error || t.reports.details.loadError}</p>
              {error ? (
                <button onClick={onRetry} type="button">
                  {t.common.tryAgain}
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <section className="report-details-modal__section">
                <h3>{t.reports.details.information}</h3>
                <dl className="report-details-modal__information-grid">
                  <div>
                    <dt>
                      {details.reportable?.number !== undefined
                        ? t.reports.details.boothNumber
                        : t.reports.table.title}
                    </dt>
                    <dd>
                      {getDisplayValue(
                        details.reportable?.number ??
                          details.reportable?.title ??
                          null,
                        t.reports.details.emptyValue,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.reports.table.title}</dt>
                    <dd>
                      {getDisplayValue(
                        details.title,
                        t.reports.details.emptyValue,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.reports.table.status}</dt>
                    <dd>
                      <ReportStatusBadge status={details.status} t={t} />
                    </dd>
                  </div>
                  <div>
                    <dt>{t.reports.table.createdAt}</dt>
                    <dd>
                      {formatReportDetailsDate(
                        details.created_at,
                        language,
                        t.reports.details.invalidDate,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.reports.details.reportedBy}</dt>
                    <dd>
                      {getDisplayValue(
                        details.reporter?.name ?? null,
                        t.reports.details.emptyValue,
                      )}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="report-details-modal__section">
                <h3>{t.reports.details.description}</h3>
                <p className="report-details-modal__long-copy">
                  {getDisplayValue(
                    details.description,
                    t.reports.details.emptyValue,
                  )}
                </p>
              </section>

              <section className="report-details-modal__section">
                <h3>{t.reports.details.adminNotes}</h3>
                <p className="report-details-modal__long-copy">
                  {getDisplayValue(
                    details.admin_notes,
                    t.reports.details.noAdminNotes,
                  )}
                </p>
              </section>
            </>
          )}
        </div>

        <ReportDetailsFooter
          details={details}
          isRejecting={isRejecting}
          isResolving={isResolving}
          onRejectClick={() => openConfirmation("reject")}
          onResolveClick={() => openConfirmation("resolve")}
        />
        </section>
      </div>

      {isConfirmationVisible && confirmationAction && details ? (
        <ReportActionConfirmModal
          action={confirmationAction}
          error={
            confirmationAction === "resolve"
              ? resolveError
              : rejectError
          }
          fieldErrors={
            confirmationAction === "resolve"
              ? resolveFieldErrors
              : rejectFieldErrors
          }
          isSubmitting={isSubmitting}
          onCancel={closeConfirmation}
          onClearErrors={() => clearActionError(confirmationAction)}
          onConfirm={confirmAction}
          reportId={details.id}
          reportTitle={details.title}
        />
      ) : null}
    </>
  );
}
