import { useEffect, useRef } from "react";
import {
  CompanyIcon,
  GalleryIcon,
} from "../../../../assets/icons/orderIcons";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type { BoothRequestDetailsApiData } from "../../types";
import { BoothRequestDetailsActions } from "./BoothRequestDetailsActions";
import { BoothRequestDetailsMainColumn } from "./BoothRequestDetailsMainColumn";
import {
  BoothRequestDetailsSideColumn,
  CompanyAvatar,
} from "./BoothRequestDetailsSideColumn";
import "./BoothRequestDetailsModal.scss";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export interface BoothRequestDetailsModalProps {
  details: BoothRequestDetailsApiData | null;
  error: string;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function BoothRequestDetailsModal({
  details,
  error,
  isLoading,
  onClose,
  onRetry,
}: BoothRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const statusLabel = details ? t.order.status[details.status] : "";

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

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="booth-request-details-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-busy={isLoading}
        aria-describedby="booth-request-details-company-meta"
        aria-labelledby="booth-request-details-title"
        aria-modal="true"
        className="booth-request-details-modal__dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="booth-request-details-modal__header">
          {details ? (
            <CompanyAvatar company={details.company} />
          ) : (
            <span
              aria-hidden="true"
              className="booth-request-details-modal__avatar"
            >
              {t.order.details.emptyValue}
            </span>
          )}
          <div className="booth-request-details-modal__header-copy">
            <div className="booth-request-details-modal__title-row">
              <h2 id="booth-request-details-title">
                {details?.company.name ?? t.order.details.title}
              </h2>
              {details ? (
                <span
                  aria-label={`${t.order.table.status}: ${statusLabel}`}
                  className={`booth-request-details-modal__status booth-request-details-modal__status--${details.status}`}
                >
                  {statusLabel}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="booth-request-details-modal__status booth-request-details-modal__status--placeholder"
                >
                  {t.order.details.emptyValue}
                </span>
              )}
            </div>
            <p id="booth-request-details-company-meta">
              <CompanyIcon aria-hidden="true" size={15} strokeWidth={1.8} />
              {details?.company.business_sector ??
                (isLoading
                  ? t.order.details.loading
                  : t.order.details.emptyValue)}
            </p>
          </div>
          <ModalCloseButton
            ariaLabel={t.order.details.closeAriaLabel}
            className="booth-request-details-modal__close"
            onClick={onClose}
          />
        </header>

        <div className="booth-request-details-modal__scroll-area">
          <div
            aria-label={t.order.details.gallery.title}
            className="booth-request-details-modal__gallery"
            role="img"
          >
            <GalleryIcon aria-hidden="true" size={30} strokeWidth={1.6} />
            <span>
              <strong>{t.order.details.gallery.title}</strong>
              <small>{t.order.details.gallery.description}</small>
            </span>
          </div>

          {details ? (
            <div className="booth-request-details-modal__content-grid">
              <BoothRequestDetailsMainColumn
                details={details}
                language={language}
                t={t}
              />
              <BoothRequestDetailsSideColumn
                details={details}
                language={language}
                t={t}
              />
            </div>
          ) : (
            <div
              aria-live="polite"
              className="booth-request-details-modal__request-state"
              role={error ? "alert" : "status"}
            >
              <p>
                {isLoading
                  ? t.order.details.loading
                  : error || t.order.details.loadError}
              </p>
              {error ? (
                <button onClick={onRetry} type="button">
                  {t.common.tryAgain}
                </button>
              ) : null}
            </div>
          )}
        </div>

        {details ? (
          <BoothRequestDetailsActions requestDetails={details} t={t} />
        ) : null}
      </section>
    </div>
  );
}
