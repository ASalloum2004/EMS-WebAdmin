import { useEffect, useRef } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { ModalCloseButton, Skeleton } from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import type { ReportDetails, ReportStatus } from "../../types";
import "./ReportDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ReportDetailsModalProps = {
  details: ReportDetails | null;
  error: string;
  isLoading: boolean;
  onApprove?: (reportId: number) => void;
  onClose: () => void;
  onReject?: (reportId: number) => void;
  onRetry: () => void;
  reportId: number;
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
  onApprove,
  onReject,
}: Pick<ReportDetailsModalProps, "details" | "onApprove" | "onReject">) {
  const { t } = useI18n();

  if (!details) {
    return null;
  }

  if (details.status === "pending") {
    const actionsAvailable = Boolean(onApprove && onReject);

    return (
      <footer className="report-details-modal__footer report-details-modal__footer--pending">
        <button
          className="report-details-modal__action report-details-modal__action--reject"
          disabled={!onReject}
          onClick={() => onReject?.(details.id)}
          type="button"
        >
          <CircleX aria-hidden="true" size={18} strokeWidth={2} />
          {t.reports.details.reject}
        </button>
        <button
          className="report-details-modal__action report-details-modal__action--approve"
          disabled={!onApprove}
          onClick={() => onApprove?.(details.id)}
          type="button"
        >
          <CircleCheck aria-hidden="true" size={18} strokeWidth={2} />
          {t.reports.details.approve}
        </button>
        {!actionsAvailable ? (
          <p className="report-details-modal__actions-note">
            {t.reports.details.actionsUnavailable}
          </p>
        ) : null}
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
  isLoading,
  onApprove,
  onClose,
  onReject,
  onRetry,
  reportId,
}: ReportDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;

    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="report-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isLoading}
        aria-labelledby="report-details-title"
        aria-modal="true"
        className="report-details-modal__dialog"
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
          ) : (
            <span className="report-details-modal__id">#{reportId}</span>
          )}
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
                    <dt>{t.reports.details.reportId}</dt>
                    <dd>#{details.id}</dd>
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
          onApprove={onApprove}
          onReject={onReject}
        />
      </section>
    </div>
  );
}
