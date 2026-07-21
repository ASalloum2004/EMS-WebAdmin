import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "../../../../api";
import {
  approveEventRequest,
  rejectEventRequest,
} from "../../api/eventRequestActionsApi";
import type {
  ApproveEventRequestConflictState,
  ApproveEventRequestResult,
  EventRequestActionResponse,
} from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";

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
  const [approveConflict, setApproveConflict] =
    useState<ApproveEventRequestConflictState | null>(null);
  const [approveConflictError, setApproveConflictError] = useState("");
  const [approveError, setApproveError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isLoadingApproveConflicts, setIsLoadingApproveConflicts] =
    useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [mutatingRequestId, setMutatingRequestId] = useState<number | null>(
    null,
  );
  const [rejectError, setRejectError] = useState("");
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

  useEffect(() => {
    setApproveError("");
    setRejectError("");

    if (
      approveConflict &&
      (approveConflict.requestId !== selectedRequestId ||
        !isPendingStatus(selectedRequestStatus))
    ) {
      setApproveConflict(null);
      setApproveConflictError("");
    }
  }, [approveConflict, selectedRequestId, selectedRequestStatus]);

  const isCurrentRequest = useCallback((eventRequestId: number) => {
    return selectionRef.current.id === eventRequestId;
  }, []);

  const isCurrentPendingRequest = useCallback(
    (eventRequestId: number) =>
      isCurrentRequest(eventRequestId) &&
      isPendingStatus(selectionRef.current.status),
    [isCurrentRequest],
  );

  const startMutation = useCallback((eventRequestId: number) => {
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
  }, [isCurrentPendingRequest]);

  const finishMutation = useCallback(() => {
    isMutationActiveRef.current = false;

    if (isMountedRef.current) {
      setMutatingRequestId(null);
    }
  }, []);

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

  const approveEventRequestById = useCallback(
    async (
      eventRequestId: number,
    ): Promise<ApproveEventRequestResult | null> => {
      if (!startMutation(eventRequestId)) {
        return null;
      }

      setApproveConflict(null);
      setApproveConflictError("");
      setApproveError("");
      setIsApproving(true);

      try {
        const result = await approveEventRequest(eventRequestId, {
          force: false,
        });

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        if (result.kind === "conflict") {
          if (!isCurrentPendingRequest(eventRequestId)) {
            return null;
          }

          setApproveConflict({
            message: result.message,
            meta: result.meta,
            requestId: eventRequestId,
            requests: result.requests,
          });
          return result;
        }

        await callbacksRef.current.onApproveSuccess?.(eventRequestId);

        return isMountedRef.current && isCurrentRequest(eventRequestId)
          ? result
          : null;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
          setApproveError(
            getActionErrorMessage(
              requestError,
              approveFallbackMessage,
              invalidStatusMessage,
            ),
          );
        }

        return null;
      } finally {
        finishMutation();

        if (isMountedRef.current) {
          setIsApproving(false);
        }
      }
    },
    [
      approveFallbackMessage,
      finishMutation,
      invalidStatusMessage,
      isCurrentPendingRequest,
      isCurrentRequest,
      refreshInvalidStatus,
      startMutation,
    ],
  );

  const rejectEventRequestById = useCallback(
    async (
      eventRequestId: number,
    ): Promise<EventRequestActionResponse | null> => {
      if (!startMutation(eventRequestId)) {
        return null;
      }

      setRejectError("");
      setIsRejecting(true);

      try {
        const response = await rejectEventRequest(eventRequestId);

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        await callbacksRef.current.onRejectSuccess?.(eventRequestId);

        return isMountedRef.current && isCurrentRequest(eventRequestId)
          ? response
          : null;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
          setRejectError(
            getActionErrorMessage(
              requestError,
              rejectFallbackMessage,
              invalidStatusMessage,
            ),
          );
        }

        return null;
      } finally {
        finishMutation();

        if (isMountedRef.current) {
          setIsRejecting(false);
        }
      }
    },
    [
      finishMutation,
      invalidStatusMessage,
      isCurrentRequest,
      refreshInvalidStatus,
      rejectFallbackMessage,
      startMutation,
    ],
  );

  const approveEventRequestAnyway = useCallback(async () => {
    const conflict = approveConflict;

    if (!conflict || !startMutation(conflict.requestId)) {
      return null;
    }

    setApproveConflictError("");
    setIsApproving(true);

    try {
      const result = await approveEventRequest(conflict.requestId, {
        force: true,
      });

      if (!isMountedRef.current || !isCurrentRequest(conflict.requestId)) {
        return null;
      }

      if (result.kind !== "approved") {
        setApproveConflictError(
          result.message || approveConflictFallbackMessage,
        );
        return null;
      }

      await callbacksRef.current.onApproveSuccess?.(conflict.requestId);

      if (!isMountedRef.current || !isCurrentRequest(conflict.requestId)) {
        return null;
      }

      setApproveConflict(null);
      setApproveConflictError("");
      return result;
    } catch (requestError) {
      await refreshInvalidStatus(requestError, conflict.requestId);

      if (isMountedRef.current && isCurrentRequest(conflict.requestId)) {
        setApproveConflictError(
          getActionErrorMessage(
            requestError,
            approveFallbackMessage,
            invalidStatusMessage,
          ),
        );
      }

      return null;
    } finally {
      finishMutation();

      if (isMountedRef.current) {
        setIsApproving(false);
      }
    }
  }, [
    approveConflict,
    approveConflictFallbackMessage,
    approveFallbackMessage,
    finishMutation,
    invalidStatusMessage,
    isCurrentRequest,
    refreshInvalidStatus,
    startMutation,
  ]);

  const loadApproveConflictPage = useCallback(
    async (page: number): Promise<ApproveEventRequestResult | null> => {
      const conflict = approveConflict;

      if (
        !conflict ||
        page === conflict.meta.current_page ||
        !startMutation(conflict.requestId)
      ) {
        return null;
      }

      setApproveConflictError("");
      setIsLoadingApproveConflicts(true);

      try {
        const result = await approveEventRequest(conflict.requestId, {
          force: false,
          page,
        });

        if (
          !isMountedRef.current ||
          !isCurrentPendingRequest(conflict.requestId)
        ) {
          return null;
        }

        if (result.kind === "conflict") {
          setApproveConflict({
            message: result.message,
            meta: result.meta,
            requestId: conflict.requestId,
            requests: result.requests,
          });
          return result;
        }

        await callbacksRef.current.onApproveSuccess?.(conflict.requestId);

        if (!isMountedRef.current || !isCurrentRequest(conflict.requestId)) {
          return null;
        }

        setApproveConflict(null);
        return result;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, conflict.requestId);

        if (isMountedRef.current && isCurrentRequest(conflict.requestId)) {
          setApproveConflictError(
            getActionErrorMessage(
              requestError,
              approveConflictFallbackMessage,
              invalidStatusMessage,
            ),
          );
        }

        return null;
      } finally {
        finishMutation();

        if (isMountedRef.current) {
          setIsLoadingApproveConflicts(false);
        }
      }
    },
    [
      approveConflict,
      approveConflictFallbackMessage,
      finishMutation,
      invalidStatusMessage,
      isCurrentPendingRequest,
      isCurrentRequest,
      refreshInvalidStatus,
      startMutation,
    ],
  );

  const closeApproveConflict = useCallback(() => {
    if (!isMountedRef.current || isMutationActiveRef.current) {
      return false;
    }

    setApproveConflict(null);
    setApproveConflictError("");
    return true;
  }, []);

  const clearApproveError = useCallback(() => {
    if (isMountedRef.current) {
      setApproveError("");
    }
  }, []);

  const clearRejectError = useCallback(() => {
    if (isMountedRef.current) {
      setRejectError("");
    }
  }, []);

  return {
    approveConflict,
    approveConflictError,
    approveError,
    approveEventRequestAnyway,
    approveEventRequestById,
    clearApproveError,
    clearRejectError,
    closeApproveConflict,
    isApproving,
    isLoadingApproveConflicts,
    isRejecting,
    loadApproveConflictPage,
    mutatingRequestId,
    rejectError,
    rejectEventRequestById,
  };
}
