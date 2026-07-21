import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../../../../api";
import type {
  ApproveEventRequestConflictState,
  ApproveEventRequestResult,
  EventRequestActionResponse,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { useApproveEventRequest } from "./useApproveEventRequest";
import { useEventRequestApprovalConflicts } from "./useEventRequestApprovalConflicts";
import { useRejectEventRequest } from "./useRejectEventRequest";

type ActionRefreshCallback = (
  eventRequestId: number,
) => Promise<unknown> | unknown;

export interface UseEventRequestActionsOptions {
  approveConflictFallbackMessage?: string;
  approveFallbackMessage?: string;
  invalidStatusMessage?: string;
  onApproveSuccess?: ActionRefreshCallback;
  onInvalidStatus?: ActionRefreshCallback;
  onRejectSuccess?: ActionRefreshCallback;
  rejectFallbackMessage?: string;
  selectedRequestId: number | null;
  selectedRequestStatus: string | null;
}

export interface UseEventRequestActionsResult {
  approveConflict: ApproveEventRequestConflictState | null;
  approveConflictError: string;
  approveError: string;
  approveEventRequestAnyway: () => Promise<ApproveEventRequestResult | null>;
  approveEventRequestById: (
    eventRequestId: number,
  ) => Promise<ApproveEventRequestResult | null>;
  clearApproveError: () => void;
  clearRejectError: () => void;
  closeApproveConflict: () => boolean;
  isApproving: boolean;
  isLoadingApproveConflicts: boolean;
  isRejecting: boolean;
  loadApproveConflictPage: (
    page: number,
  ) => Promise<ApproveEventRequestResult | null>;
  mutatingRequestId: number | null;
  rejectError: string;
  rejectEventRequestById: (
    eventRequestId: number,
  ) => Promise<EventRequestActionResponse | null>;
}

function getActionErrorMessage(
  error: unknown,
  fallbackMessage: string,
  invalidStatusMessage: string,
) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.trim();

  if (message === "event.invalid_status" && invalidStatusMessage) {
    return invalidStatusMessage;
  }

  return message || fallbackMessage;
}

function isInvalidStatusError(error: unknown) {
  return (
    error instanceof ApiRequestError &&
    error.status === 400 &&
    error.message.trim() === "event.invalid_status"
  );
}

function isPendingStatus(status: unknown) {
  return getTrimmedString(status).toLowerCase() === "pending";
}

export function useEventRequestActions({
  approveConflictFallbackMessage = "Unable to load conflicting Event Requests.",
  approveFallbackMessage = "Unable to approve Event Request.",
  invalidStatusMessage = "",
  onApproveSuccess,
  onInvalidStatus,
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject Event Request.",
  selectedRequestId,
  selectedRequestStatus,
}: UseEventRequestActionsOptions): UseEventRequestActionsResult {
  const [mutatingRequestId, setMutatingRequestId] = useState<number | null>(
    null,
  );
  const callbacksRef = useRef({
    onApproveSuccess,
    onInvalidStatus,
    onRejectSuccess,
  });
  const isMountedRef = useRef(false);
  const isMutationActiveRef = useRef(false);
  const selectionRef = useRef({
    id: selectedRequestId,
    status: selectedRequestStatus,
  });

  callbacksRef.current = {
    onApproveSuccess,
    onInvalidStatus,
    onRejectSuccess,
  };
  selectionRef.current = {
    id: selectedRequestId,
    status: selectedRequestStatus,
  };

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isMutationActiveRef.current = false;
    };
  }, []);

  const isCurrentRequest = useCallback(
    (eventRequestId: number) => selectionRef.current.id === eventRequestId,
    [],
  );

  const isCurrentPendingRequest = useCallback(
    (eventRequestId: number) =>
      isCurrentRequest(eventRequestId) &&
      isPendingStatus(selectionRef.current.status),
    [isCurrentRequest],
  );

  const acquireMutation = useCallback(
    (eventRequestId: number) => {
      if (
        !isMountedRef.current ||
        isMutationActiveRef.current ||
        !isCurrentPendingRequest(eventRequestId)
      ) {
        return false;
      }

      isMutationActiveRef.current = true;
      setMutatingRequestId(eventRequestId);
      return true;
    },
    [isCurrentPendingRequest],
  );

  const releaseMutation = useCallback(() => {
    isMutationActiveRef.current = false;

    if (isMountedRef.current) {
      setMutatingRequestId(null);
    }
  }, []);

  const isMutationActive = useCallback(
    () => isMutationActiveRef.current,
    [],
  );

  const getErrorMessage = useCallback(
    (error: unknown, fallbackMessage: string) =>
      getActionErrorMessage(
        error,
        fallbackMessage,
        invalidStatusMessage,
      ),
    [invalidStatusMessage],
  );

  const refreshInvalidStatus = useCallback(
    async (error: unknown, eventRequestId: number) => {
      if (!isInvalidStatusError(error)) {
        return;
      }

      try {
        await callbacksRef.current.onInvalidStatus?.(eventRequestId);
      } catch {
        // Preserve the backend invalid-status error when refresh fails.
      }
    },
    [],
  );

  const notifyApproveSuccess = useCallback(
    (eventRequestId: number) =>
      callbacksRef.current.onApproveSuccess?.(eventRequestId),
    [],
  );

  const notifyRejectSuccess = useCallback(
    (eventRequestId: number) =>
      callbacksRef.current.onRejectSuccess?.(eventRequestId),
    [],
  );

  const conflicts = useEventRequestApprovalConflicts({
    acquireMutation,
    fallbackMessage: approveConflictFallbackMessage,
    getErrorMessage,
    isCurrentPendingRequest,
    isCurrentRequest,
    isMutationActive,
    onApproveSuccess: notifyApproveSuccess,
    refreshInvalidStatus,
    releaseMutation,
  });
  const approval = useApproveEventRequest({
    acquireMutation,
    conflictFallbackMessage: approveConflictFallbackMessage,
    fallbackMessage: approveFallbackMessage,
    getErrorMessage,
    isCurrentPendingRequest,
    isCurrentRequest,
    onApproveStart: conflicts.resetApproveConflict,
    onApproveSuccess: notifyApproveSuccess,
    onConflict: conflicts.openApproveConflict,
    onForcedApprovalStart: conflicts.clearApproveConflictError,
    onForcedApprovalSuccess: conflicts.resetApproveConflict,
    refreshInvalidStatus,
    releaseMutation,
  });
  const rejection = useRejectEventRequest({
    acquireMutation,
    fallbackMessage: rejectFallbackMessage,
    getErrorMessage,
    isCurrentRequest,
    onRejectSuccess: notifyRejectSuccess,
    refreshInvalidStatus,
    releaseMutation,
  });

  useEffect(() => {
    approval.clearApproveError();
    rejection.clearRejectError();
  }, [
    approval.clearApproveError,
    conflicts.approveConflict,
    rejection.clearRejectError,
    selectedRequestId,
  ]);

  useEffect(() => {
    if (
      conflicts.approveConflict &&
      (conflicts.approveConflict.requestId !== selectedRequestId ||
        !isPendingStatus(selectedRequestStatus))
    ) {
      conflicts.resetApproveConflict();
    }
  }, [
    conflicts.approveConflict,
    conflicts.resetApproveConflict,
    selectedRequestId,
    selectedRequestStatus,
  ]);

  const approveEventRequestAnyway = useCallback(async () => {
    if (!conflicts.approveConflict) {
      return null;
    }

    return approval.approveEventRequestAnyway(
      conflicts.approveConflict.requestId,
    );
  }, [approval.approveEventRequestAnyway, conflicts.approveConflict]);

  const closeApproveConflict = useCallback(
    () =>
      conflicts.closeApproveConflict(approval.clearForcedApproveError),
    [
      approval.clearForcedApproveError,
      conflicts.closeApproveConflict,
    ],
  );

  const loadApproveConflictPage = useCallback(
    (page: number) =>
      conflicts.loadApproveConflictPage(
        page,
        approval.clearForcedApproveError,
      ),
    [
      approval.clearForcedApproveError,
      conflicts.loadApproveConflictPage,
    ],
  );

  return {
    approveConflict: conflicts.approveConflict,
    approveConflictError:
      approval.forcedApproveError || conflicts.approveConflictError,
    approveError: approval.approveError,
    approveEventRequestAnyway,
    approveEventRequestById: approval.approveEventRequestById,
    clearApproveError: approval.clearApproveError,
    clearRejectError: rejection.clearRejectError,
    closeApproveConflict,
    isApproving: approval.isApproving,
    isLoadingApproveConflicts: conflicts.isLoadingApproveConflicts,
    isRejecting: rejection.isRejecting,
    loadApproveConflictPage,
    mutatingRequestId,
    rejectError: rejection.rejectError,
    rejectEventRequestById: rejection.rejectEventRequestById,
  };
}
