import { useEffect, useId, useRef } from "react";
import { ApproveRequestIcon } from "../../../../assets/icons/orderIcons";
import { TableFooter } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { ApproveEventRequestConflictState } from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import {
  formatCreatedDate,
  formatDateTime,
  formatDuration,
  getStatusLabel,
  getStatusModifier,
  getTypeLabel,
} from "../EventRequestDetailsModal/EventRequestDetailsModal.utils";
import "./ApproveEventRequestConflictModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ApproveEventRequestConflictModalProps {
  conflict: ApproveEventRequestConflictState;
  error: string;
  isApproving: boolean;
  isPageLoading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<unknown> | unknown;
  onPageChange: (page: number) => Promise<unknown> | unknown;
}

export function ApproveEventRequestConflictModal({
  conflict,
  error,
  isApproving,
  isPageLoading,
  onCancel,
  onConfirm,
  onPageChange,
}: ApproveEventRequestConflictModalProps) {
  const { language, t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const lastRequestedPageRef = useRef(conflict.meta.current_page);
  const descriptionId = useId();
  const errorId = useId();
  const loadingId = useId();
  const titleId = useId();
  const isBusy = isApproving || isPageLoading;
  const labels = t.order.eventRequests.approveConflict;
  const detailsLabels = t.order.eventRequests.details;
  const fallbackExplanation = labels.message.replace(
    "{{id}}",
    String(conflict.requestId),
  );
  const explanation =
    getTrimmedString(conflict.message) || fallbackExplanation;
  const conflictCount = labels.count.replace(
    "{{count}}",
    String(conflict.meta.total),
  );
  const failedPage =
    error && lastRequestedPageRef.current !== conflict.meta.current_page
      ? lastRequestedPageRef.current
      : null;

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

        if (!isBusy) {
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
  }, [isBusy, onCancel]);

  useEffect(() => {
    if (!isBusy && error) {
      cancelButtonRef.current?.focus();
    }
  }, [error, isBusy]);

  const requestPage = (page: number) => {
    lastRequestedPageRef.current = page;
    void onPageChange(page);
  };

  return (
    <div
      className="approve-event-request-conflict-modal"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget && !isBusy) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isBusy}
        aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}${
          isPageLoading ? ` ${loadingId}` : ""
        }`}
        aria-labelledby={titleId}
        aria-modal="true"
        className="approve-event-request-conflict-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div className="approve-event-request-conflict-modal__header">
          <div
            aria-hidden="true"
            className="approve-event-request-conflict-modal__icon"
          >
            <ApproveRequestIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h2
              className="approve-event-request-conflict-modal__title"
              id={titleId}
            >
              {labels.title}
            </h2>
            <p
              className="approve-event-request-conflict-modal__message"
              id={descriptionId}
            >
              {explanation}
            </p>
          </div>
        </div>

        <strong className="approve-event-request-conflict-modal__count">
          {conflictCount}
        </strong>

        <ul className="approve-event-request-conflict-modal__list">
          {conflict.requests.map((request) => {
            const emptyValue = detailsLabels.notAvailable;
            const statusLabel = getStatusLabel(request.status, t);

            return (
              <li
                className="approve-event-request-conflict-modal__request"
                key={request.id}
              >
                <h3>{getTrimmedString(request.title) || emptyValue}</h3>
                <dl>
                  <div>
                    <dt>{detailsLabels.requestId}</dt>
                    <dd>#{request.id}</dd>
                  </div>
                  <div>
                    <dt>{labels.organizer}</dt>
                    <dd>
                      {getTrimmedString(request.eventable?.name) || emptyValue}
                    </dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.eventHall}</dt>
                    <dd>
                      {request.event_hall_id === null
                        ? emptyValue
                        : `#${request.event_hall_id}`}
                    </dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.type}</dt>
                    <dd>{getTypeLabel(request.type, t)}</dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.status}</dt>
                    <dd>
                      <span
                        className={`approve-event-request-conflict-modal__status approve-event-request-conflict-modal__status--${getStatusModifier(request.status)}`}
                      >
                        {statusLabel}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.startTime}</dt>
                    <dd>{formatDateTime(request.start_at, language, t)}</dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.endTime}</dt>
                    <dd>{formatDateTime(request.end_at, language, t)}</dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.duration}</dt>
                    <dd>{formatDuration(request.duration, language, t)}</dd>
                  </div>
                  <div>
                    <dt>{detailsLabels.createdAt}</dt>
                    <dd>{formatCreatedDate(request.created_at, language, t)}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        {isPageLoading ? (
          <p
            className="approve-event-request-conflict-modal__loading"
            id={loadingId}
            role="status"
          >
            {labels.loading}
          </p>
        ) : null}

        {error ? (
          <div className="approve-event-request-conflict-modal__error" id={errorId}>
            <p role="alert">{error}</p>
            {failedPage !== null ? (
              <button
                disabled={isBusy}
                onClick={() => requestPage(failedPage)}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            ) : null}
          </div>
        ) : null}

        <div
          className="approve-event-request-conflict-modal__pagination"
          inert={isBusy ? true : undefined}
        >
          <TableFooter
            currentPage={conflict.meta.current_page}
            onPageChange={requestPage}
            perPage={conflict.meta.per_page}
            totalItems={conflict.meta.total}
            totalPages={conflict.meta.last_page}
          />
        </div>

        <div className="approve-event-request-conflict-modal__actions">
          <button
            className="approve-event-request-conflict-modal__button approve-event-request-conflict-modal__button--cancel"
            disabled={isBusy}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="approve-event-request-conflict-modal__button approve-event-request-conflict-modal__button--confirm"
            disabled={isBusy}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isApproving ? labels.approving : labels.approveAnyway}
          </button>
        </div>
      </section>
    </div>
  );
}
