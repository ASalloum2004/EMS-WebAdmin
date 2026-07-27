import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "../../../../i18n";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { ApproveEventRequestConflictModal } from "../ApproveEventRequestConflictModal";
import { ApproveEventRequestConfirmModal } from "../ApproveEventRequestConfirmModal";
import { RejectEventRequestConfirmModal } from "../RejectEventRequestConfirmModal";
import { EventRequestDetailsSkeleton } from "../skeletons";
import { EventRequestDetailsFooter } from "./EventRequestDetailsFooter";
import { EventRequestDetailsHeader } from "./EventRequestDetailsHeader";
import type { EventRequestDetailsModalProps } from "./EventRequestDetailsModal.types";
import { EventRequestDetailsStates } from "./EventRequestDetailsStates";
import { EventRequestEngagementSection } from "./EventRequestEngagementSection";
import { EventRequestInformationSection } from "./EventRequestInformationSection";
import { EventRequestLogoShowcase } from "./EventRequestLogoShowcase";
import { EventRequestOrganizerSection } from "./EventRequestOrganizerSection";
import { EventRequestSpeakersSection } from "./EventRequestSpeakersSection";
import "./EventRequestDetailsModal.scss";

export type { EventRequestDetailsModalProps } from "./EventRequestDetailsModal.types";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type ConfirmationTarget = {
  id: number;
  title: string | null;
};

export function EventRequestDetailsModal({
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
}: EventRequestDetailsModalProps) {
  const { language, t } = useI18n();
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const selectedDetailsIdRef = useRef<number | null>(null);
  const [approveConfirmation, setApproveConfirmation] =
    useState<ConfirmationTarget | null>(null);
  const [rejectConfirmation, setRejectConfirmation] =
    useState<ConfirmationTarget | null>(null);
  const isPending =
    getTrimmedString(details?.status).toLowerCase() === "pending";
  const isApproveConflictVisible = Boolean(
    approveConflict &&
      details?.id === approveConflict.requestId &&
      isPending,
  );
  const isApproveConfirmationVisible = Boolean(
    approveConfirmation &&
      !isApproveConflictVisible &&
      ((details?.id === approveConfirmation.id && isPending) || isApproving),
  );
  const isRejectConfirmationVisible = Boolean(
    rejectConfirmation &&
      ((details?.id === rejectConfirmation.id && isPending) || isRejecting),
  );
  const isChildModalVisible =
    isApproveConflictVisible ||
    isApproveConfirmationVisible ||
    isRejectConfirmationVisible;
  const terminalActionError = !isPending ? approveError || rejectError : "";

  const closeApproveConfirmation = useCallback(() => {
    if (isApproving || isRejecting) {
      return;
    }

    setApproveConfirmation(null);
    onClearApproveError();
  }, [isApproving, isRejecting, onClearApproveError]);

  const closeRejectConfirmation = useCallback(() => {
    if (isApproving || isRejecting) {
      return;
    }

    setRejectConfirmation(null);
    onClearRejectError();
  }, [isApproving, isRejecting, onClearRejectError]);

  const openApproveConfirmation = useCallback(() => {
    if (!details || !isPending || isApproving || isRejecting) {
      return;
    }

    onClearApproveError();
    setRejectConfirmation(null);
    setApproveConfirmation({ id: details.id, title: details.title });
  }, [
    details,
    isApproving,
    isPending,
    isRejecting,
    onClearApproveError,
  ]);

  const openRejectConfirmation = useCallback(() => {
    if (!details || !isPending || isApproving || isRejecting) {
      return;
    }

    onClearRejectError();
    setApproveConfirmation(null);
    setRejectConfirmation({ id: details.id, title: details.title });
  }, [
    details,
    isApproving,
    isPending,
    isRejecting,
    onClearRejectError,
  ]);

  const confirmApprove = useCallback(async () => {
    const target = approveConfirmation;

    if (!target || isApproving || isRejecting) {
      return;
    }

    const response = await onApprove(target.id);

    if (response) {
      setApproveConfirmation(null);
    }
  }, [approveConfirmation, isApproving, isRejecting, onApprove]);

  const confirmReject = useCallback(async () => {
    const target = rejectConfirmation;

    if (!target || isApproving || isRejecting) {
      return;
    }

    const response = await onReject(target.id);

    if (response) {
      setRejectConfirmation(null);
    }
  }, [isApproving, isRejecting, onReject, rejectConfirmation]);

  useEffect(() => {
    if (details?.id === undefined) {
      return;
    }

    if (
      selectedDetailsIdRef.current !== null &&
      selectedDetailsIdRef.current !== details.id
    ) {
      setApproveConfirmation(null);
      setRejectConfirmation(null);
    }

    selectedDetailsIdRef.current = details.id;
  }, [details?.id]);

  useEffect(() => {
    if (!isPending && !isApproving && !isRejecting) {
      setApproveConfirmation(null);
      setRejectConfirmation(null);
    }
  }, [isApproving, isPending, isRejecting]);

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
      if (isChildModalVisible) {
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
  }, [isChildModalVisible, onClose]);

  return (
    <>
      <div
        className="event-request-details-modal"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !isChildModalVisible
          ) {
            onClose();
          }
        }}
        role="presentation"
      >
        <section
          aria-busy={isLoading}
          aria-hidden={isChildModalVisible ? true : undefined}
          aria-labelledby="event-request-details-title"
          aria-modal="true"
          className="event-request-details-modal__dialog"
          inert={isChildModalVisible ? true : undefined}
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
        >
          <EventRequestDetailsHeader
            details={details}
            error={error}
            isLoading={isLoading}
            onClose={onClose}
            t={t}
          />

          <div className="event-request-details-modal__scroll-area">
            {isLoading && !details ? (
              <EventRequestDetailsSkeleton />
            ) : details ? (
              <>
                <EventRequestLogoShowcase
                  logo={details.logo}
                  title={details.title}
                  t={t}
                />
                <div className="event-request-details-modal__content-grid">
                  <div className="event-request-details-modal__column">
                    <EventRequestInformationSection
                      details={details}
                      language={language}
                      t={t}
                    />
                    <EventRequestSpeakersSection
                      speakers={details.speakers}
                      t={t}
                    />
                  </div>
                  <div className="event-request-details-modal__column">
                    <EventRequestOrganizerSection
                      organizer={details.eventable}
                      t={t}
                    />
                    <EventRequestEngagementSection
                      averageRating={details.average_rating}
                      language={language}
                      qrScansCount={details.qr_scans_count}
                      savedCount={details.saved_count}
                      t={t}
                    />
                  </div>
                </div>
              </>
            ) : (
              <EventRequestDetailsStates
                error={error}
                isLoading={isLoading}
                onRetry={onRetry}
                t={t}
              />
            )}
          </div>

          {terminalActionError ? (
            <p className="event-request-details-modal__action-error" role="alert">
              {terminalActionError}
            </p>
          ) : null}

          {details ? (
            <EventRequestDetailsFooter
              approveButtonRef={approveButtonRef}
              isApproving={isApproving}
              isRejecting={isRejecting}
              onApprove={openApproveConfirmation}
              onReject={openRejectConfirmation}
              rejectButtonRef={rejectButtonRef}
              status={details.status}
              t={t}
            />
          ) : null}
        </section>
      </div>

      {isApproveConfirmationVisible && approveConfirmation ? (
        <ApproveEventRequestConfirmModal
          error={approveError}
          eventTitle={approveConfirmation.title}
          isApproving={isApproving}
          onCancel={closeApproveConfirmation}
          onConfirm={confirmApprove}
          requestId={approveConfirmation.id}
        />
      ) : null}

      {isApproveConflictVisible && approveConflict ? (
        <ApproveEventRequestConflictModal
          conflict={approveConflict}
          error={approveConflictError}
          isApproving={isApproving}
          isPageLoading={isLoadingApproveConflicts}
          onCancel={onCloseApproveConflict}
          onConfirm={onApproveAnyway}
          onPageChange={onApproveConflictPageChange}
        />
      ) : null}

      {isRejectConfirmationVisible && rejectConfirmation ? (
        <RejectEventRequestConfirmModal
          error={rejectError}
          eventTitle={rejectConfirmation.title}
          isRejecting={isRejecting}
          onCancel={closeRejectConfirmation}
          onConfirm={confirmReject}
          requestId={rejectConfirmation.id}
        />
      ) : null}
    </>
  );
}
