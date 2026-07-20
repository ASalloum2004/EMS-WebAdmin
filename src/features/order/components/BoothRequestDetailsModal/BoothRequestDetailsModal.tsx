import "./BoothRequestDetailsModal.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CompanyIcon,
  GalleryIcon,
} from "../../../../assets/icons/orderIcons";
import { ModalCloseButton } from "../../../../components";
import { useI18n } from "../../../../i18n";
import type {
  ApproveBoothRequestConflictState,
  ApproveBoothRequestResult,
  BoothRequestActionResponse,
  BoothRequestDetailsApiData,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { ApproveBoothRequestConflictModal } from "../ApproveBoothRequestConflictModal";
import { ApproveBoothRequestConfirmModal } from "../ApproveBoothRequestConfirmModal";
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
  approveConflict: ApproveBoothRequestConflictState | null;
  approveConflictError: string;
  approveError: string;
  details: BoothRequestDetailsApiData | null;
  error: string;
  isApproving: boolean;
  isLoading: boolean;
  isLoadingApproveConflicts: boolean;
  isRejecting: boolean;
  onApprove: (
    boothRequestId: number,
  ) =>
    | ApproveBoothRequestResult
    | null
    | Promise<ApproveBoothRequestResult | null>;
  onApproveAnyway: () =>
    | ApproveBoothRequestResult
    | null
    | Promise<ApproveBoothRequestResult | null>;
  onApproveConflictPageChange: (
    page: number,
  ) =>
    | ApproveBoothRequestResult
    | null
    | Promise<ApproveBoothRequestResult | null>;
  onClearApproveError: () => void;
  onClearRejectError: () => void;
  onClose: () => void;
  onCloseApproveConflict: () => void;
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
  approveConflict,
  approveConflictError,
  approveError,
  details,
  error,
  isApproving,
  isLoading,
  isLoadingApproveConflicts,
  isRejecting,
  onApprove,
  onApproveAnyway,
  onApproveConflictPageChange,
  onClearApproveError,
  onClearRejectError,
  onClose,
  onCloseApproveConflict,
  onReject,
  onRetry,
  rejectError,
}: BoothRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const [isApproveConfirmationOpen, setIsApproveConfirmationOpen] =
    useState(false);
  const [approveConfirmationRequestId, setApproveConfirmationRequestId] =
    useState<number | null>(null);
  const [isRejectConfirmationOpen, setIsRejectConfirmationOpen] =
    useState(false);
  const [rejectConfirmationRequestId, setRejectConfirmationRequestId] =
    useState<number | null>(null);
  const statusLabel = details ? t.order.status[details.status] : "";
  const isApproveConflictVisible = Boolean(
    approveConflict &&
      details?.status === "pending" &&
      details.id === approveConflict.requestId,
  );
  const isRejectConfirmationVisible =
    isRejectConfirmationOpen &&
    details?.status === "pending" &&
    details.id === rejectConfirmationRequestId;
  const isApproveConfirmationVisible =
    isApproveConfirmationOpen &&
    !isApproveConflictVisible &&
    details?.status === "pending" &&
    details.id === approveConfirmationRequestId;
  const isConfirmationVisible =
    isApproveConflictVisible ||
    isApproveConfirmationVisible ||
    isRejectConfirmationVisible;

  const closeApproveConfirmation = useCallback(() => {
    if (isApproving || isRejecting) {
      return;
    }

    setIsApproveConfirmationOpen(false);
    setApproveConfirmationRequestId(null);
    onClearApproveError();
  }, [isApproving, isRejecting, onClearApproveError]);

  const closeRejectConfirmation = useCallback(() => {
    if (isRejecting || isApproving) {
      return;
    }

    setIsRejectConfirmationOpen(false);
    setRejectConfirmationRequestId(null);
    onClearRejectError();
  }, [isApproving, isRejecting, onClearRejectError]);

  const openApproveConfirmation = useCallback(() => {
    if (
      !details ||
      details.status !== "pending" ||
      isApproving ||
      isRejecting
    ) {
      return;
    }

    onClearApproveError();
    setIsRejectConfirmationOpen(false);
    setRejectConfirmationRequestId(null);
    setApproveConfirmationRequestId(details.id);
    setIsApproveConfirmationOpen(true);
  }, [
    details,
    isApproving,
    isRejecting,
    onClearApproveError,
  ]);

  const openRejectConfirmation = useCallback(() => {
    if (
      !details ||
      details.status !== "pending" ||
      isRejecting ||
      isApproving
    ) {
      return;
    }

    onClearRejectError();
    setIsApproveConfirmationOpen(false);
    setApproveConfirmationRequestId(null);
    setRejectConfirmationRequestId(details.id);
    setIsRejectConfirmationOpen(true);
  }, [details, isApproving, isRejecting, onClearRejectError]);

  const confirmApprove = useCallback(async () => {
    if (
      !details ||
      details.status !== "pending" ||
      isApproving ||
      isRejecting
    ) {
      return;
    }

    const response = await onApprove(details.id);

    if (response) {
      setIsApproveConfirmationOpen(false);
      setApproveConfirmationRequestId(null);
    }
  }, [details, isApproving, isRejecting, onApprove]);

  const confirmReject = useCallback(async () => {
    if (
      !details ||
      details.status !== "pending" ||
      isRejecting ||
      isApproving
    ) {
      return;
    }

    const response = await onReject(details.id);

    if (response) {
      setIsRejectConfirmationOpen(false);
      setRejectConfirmationRequestId(null);
    }
  }, [details, isApproving, isRejecting, onReject]);

  useEffect(() => {
    setIsApproveConfirmationOpen(false);
    setApproveConfirmationRequestId(null);
    setIsRejectConfirmationOpen(false);
    setRejectConfirmationRequestId(null);
  }, [details?.id]);

  useEffect(() => {
    if (details?.status !== "pending") {
      setIsApproveConfirmationOpen(false);
      setApproveConfirmationRequestId(null);
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

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmationVisible, onClose]);

  return (
    <>
      <div
        className="booth-request-details-modal"
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
          aria-describedby="booth-request-details-company-meta"
          aria-hidden={isConfirmationVisible ? true : undefined}
          aria-labelledby="booth-request-details-title"
          aria-modal="true"
          className="booth-request-details-modal__dialog"
          inert={isConfirmationVisible ? true : undefined}
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
            approveButtonRef={approveButtonRef}
            isApproving={isApproving}
            isRejecting={isRejecting}
            onApproveClick={openApproveConfirmation}
            onRejectClick={openRejectConfirmation}
            rejectButtonRef={rejectButtonRef}
            requestDetails={details}
            t={t}
          />
        ) : null}
        </section>
      </div>

      {isApproveConfirmationVisible && details ? (
        <ApproveBoothRequestConfirmModal
          error={approveError}
          isApproving={isApproving}
          onCancel={closeApproveConfirmation}
          onConfirm={confirmApprove}
          requestId={details.id}
        />
      ) : null}

      {isApproveConflictVisible && approveConflict ? (
        <ApproveBoothRequestConflictModal
          conflict={approveConflict}
          error={approveConflictError}
          isApproving={isApproving}
          isPageLoading={isLoadingApproveConflicts}
          onCancel={onCloseApproveConflict}
          onConfirm={onApproveAnyway}
          onPageChange={onApproveConflictPageChange}
        />
      ) : null}

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
