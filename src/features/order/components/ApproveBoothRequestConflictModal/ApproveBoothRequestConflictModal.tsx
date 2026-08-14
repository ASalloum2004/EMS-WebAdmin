import { useEffect, useId, useRef } from "react";
import { ApproveRequestIcon } from "../../../../assets/icons/orderIcons";
import { TableFooter } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { ApproveBoothRequestConflictState } from "../../types";
import { formatPrice } from "../BoothRequestDetailsModal/BoothRequestDetailsMainColumn";
import "./ApproveBoothRequestConflictModal.scss";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ApproveBoothRequestConflictModalProps {
  conflict: ApproveBoothRequestConflictState;
  error: string;
  isApproving: boolean;
  isPageLoading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<unknown> | unknown;
  onPageChange: (page: number) => Promise<unknown> | unknown;
}

export function ApproveBoothRequestConflictModal({
  conflict,
  error,
  isApproving,
  isPageLoading,
  onCancel,
  onConfirm,
  onPageChange,
}: ApproveBoothRequestConflictModalProps) {
  const { language, t } = useI18n();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const descriptionId = useId();
  const errorId = useId();
  const loadingId = useId();
  const titleId = useId();
  const isBusy = isApproving || isPageLoading;
  const explanation = t.order.approveConflict.message;
  const conflictCount = t.order.approveConflict.count.replace(
    "{{count}}",
    String(conflict.meta.total),
  );

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

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isBusy, onCancel]);

  useEffect(() => {
    if (!isBusy && error) {
      cancelButtonRef.current?.focus();
    }
  }, [error, isBusy]);

  return (
    <div
      className="approve-booth-request-conflict-modal"
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
        className="approve-booth-request-conflict-modal__dialog"
        ref={dialogRef}
        role="alertdialog"
        tabIndex={-1}
      >
        <div className="approve-booth-request-conflict-modal__header">
          <div
            aria-hidden="true"
            className="approve-booth-request-conflict-modal__icon"
          >
            <ApproveRequestIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h2
              className="approve-booth-request-conflict-modal__title"
              id={titleId}
            >
              {t.order.approveConflict.title}
            </h2>
            <p
              className="approve-booth-request-conflict-modal__message"
              id={descriptionId}
            >
              {explanation}
            </p>
          </div>
        </div>

        <strong className="approve-booth-request-conflict-modal__count">
          {conflictCount}
        </strong>

        <ul className="approve-booth-request-conflict-modal__list">
          {conflict.requests.map((request, index) => {
            const statusLabel = request.status
              ? t.order.status[request.status]
              : t.order.details.emptyValue;
            const requestKey =
              request.id ?? `${conflict.meta.current_page}-${index}`;

            return (
              <li
                className="approve-booth-request-conflict-modal__request"
                key={requestKey}
              >
                <dl>
                  <div>
                    <dt>{t.order.table.status}</dt>
                    <dd>
                      <span
                        className={`booth-request-details-modal__status booth-request-details-modal__status--${request.status ?? "placeholder"}`}
                      >
                        {statusLabel}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.order.approveConflict.finalPrice}</dt>
                    <dd>
                      {request.final_price === null
                        ? t.order.details.emptyValue
                        : formatPrice(request.final_price, language)}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>

        {isPageLoading ? (
          <p
            className="approve-booth-request-conflict-modal__loading"
            id={loadingId}
            role="status"
          >
            {t.order.approveConflict.loading}
          </p>
        ) : null}

        {error ? (
          <p
            className="approve-booth-request-conflict-modal__error"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div
          className="approve-booth-request-conflict-modal__pagination"
          inert={isBusy ? true : undefined}
        >
          <TableFooter
            currentPage={conflict.meta.current_page}
            onPageChange={(page) => void onPageChange(page)}
            perPage={conflict.meta.per_page}
            totalItems={conflict.meta.total}
            totalPages={conflict.meta.last_page}
          />
        </div>

        <div className="approve-booth-request-conflict-modal__actions">
          <button
            className="approve-booth-request-conflict-modal__button approve-booth-request-conflict-modal__button--cancel"
            disabled={isBusy}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {t.common.cancel}
          </button>
          <button
            className="approve-booth-request-conflict-modal__button approve-booth-request-conflict-modal__button--confirm"
            disabled={isBusy}
            onClick={() => void onConfirm()}
            type="button"
          >
            {isApproving
              ? t.order.approveConflict.approving
              : t.order.approveConflict.approveAnyway}
          </button>
        </div>
      </section>
    </div>
  );
}
