import "./BoothRequestDetailsModal.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CompanyIcon,
  GalleryIcon,
} from "../../../../assets/icons/orderIcons";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type {
  BoothRequestActionResponse,
  BoothRequestDetailsApiData,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { RejectBoothRequestConfirmModal } from "../RejectBoothRequestConfirmModal";
import { BoothRequestDetailsActions } from "./BoothRequestDetailsActions";
import { BoothRequestDetailsMainColumn } from "./BoothRequestDetailsMainColumn";
import {
  BoothRequestDetailsSideColumn,
  CompanyAvatar,
} from "./BoothRequestDetailsSideColumn";

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
  isRejecting: boolean;
  onClearRejectError: () => void;
  onClose: () => void;
  onReject: (
    boothRequestId: number,
  ) =>
    | BoothRequestActionResponse
    | null
    | Promise<BoothRequestActionResponse | null>;
  onRetry: () => void;
  rejectError: string;
}

export function BoothRequestDetailsModal({
  details,
  error,
  isLoading,
  isRejecting,
  onClearRejectError,
  onClose,
  onReject,
  onRetry,
  rejectError,
}: BoothRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const isRejectingRef = useRef(isRejecting);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const [isRejectConfirmationOpen, setIsRejectConfirmationOpen] =
    useState(false);
  const [rejectConfirmationRequestId, setRejectConfirmationRequestId] =
    useState<number | null>(null);
  const statusLabel = details ? t.order.status[details.status] : "";
  const isRejectConfirmationVisible =
    isRejectConfirmationOpen &&
    details?.status === "pending" &&
    details.id === rejectConfirmationRequestId;
  const isRejectConfirmationVisibleRef = useRef(
    isRejectConfirmationVisible,
  );

  isRejectingRef.current = isRejecting;
  isRejectConfirmationVisibleRef.current = isRejectConfirmationVisible;

  const closeRejectConfirmation = useCallback(() => {
    if (isRejectingRef.current) {
      return;
    }

    setIsRejectConfirmationOpen(false);
    setRejectConfirmationRequestId(null);
    onClearRejectError();
  }, [onClearRejectError]);

  const openRejectConfirmation = useCallback(() => {
    if (!details || details.status !== "pending" || isRejecting) {
      return;
    }

    onClearRejectError();
    setRejectConfirmationRequestId(details.id);
    setIsRejectConfirmationOpen(true);
  }, [details, isRejecting, onClearRejectError]);

  const confirmReject = useCallback(async () => {
    if (!details || details.status !== "pending" || isRejecting) {
      return;
    }

    const response = await onReject(details.id);

    if (response) {
      setIsRejectConfirmationOpen(false);
      setRejectConfirmationRequestId(null);
    }
  }, [details, isRejecting, onReject]);

  useEffect(() => {
    setIsRejectConfirmationOpen(false);
    setRejectConfirmationRequestId(null);
  }, [details?.id]);

  useEffect(() => {
    if (details?.status !== "pending") {
      setIsRejectConfirmationOpen(false);
      setRejectConfirmationRequestId(null);
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

    function handleKeyDown(event: KeyboardEvent) {
      if (isRejectConfirmationVisibleRef.current) {
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
    <>
      <div
        className="booth-request-details-modal"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !isRejectConfirmationVisibleRef.current
          ) {
            onClose();
          }
        }}
        role="presentation"
      >
        <section
          aria-busy={isLoading}
          aria-describedby="booth-request-details-company-meta"
          aria-hidden={isRejectConfirmationVisible ? true : undefined}
          aria-labelledby="booth-request-details-title"
          aria-modal="true"
          className="booth-request-details-modal__dialog"
          inert={isRejectConfirmationVisible ? true : undefined}
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
                {getTrimmedString(details?.company.name) ||
                  t.order.details.title}
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
              {getTrimmedString(details?.company.business_sector) ||
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
          <BoothRequestDetailsActions
            isRejecting={isRejecting}
            onRejectClick={openRejectConfirmation}
            rejectButtonRef={rejectButtonRef}
            requestDetails={details}
            t={t}
          />
        ) : null}
        </section>
      </div>

      {isRejectConfirmationVisible && details ? (
        <RejectBoothRequestConfirmModal
          error={rejectError}
          isRejecting={isRejecting}
          onCancel={closeRejectConfirmation}
          onConfirm={confirmReject}
          requestId={details.id}
        />
      ) : null}
    </>
  );
}
