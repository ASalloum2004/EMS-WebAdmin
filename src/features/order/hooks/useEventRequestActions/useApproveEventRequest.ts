import { useCallback, useEffect, useRef, useState } from "react";
import { approveEventRequest } from "../../api/eventRequestActionsApi";
import type { ApproveEventRequestResult } from "../../types";

type ApproveConflictResult = Extract<
  ApproveEventRequestResult,
  { kind: "conflict" }
>;

export interface UseApproveEventRequestOptions {
  acquireMutation: (eventRequestId: number) => boolean;
  conflictFallbackMessage: string;
  fallbackMessage: string;
  getErrorMessage: (error: unknown, fallbackMessage: string) => string;
  isCurrentPendingRequest: (eventRequestId: number) => boolean;
  isCurrentRequest: (eventRequestId: number) => boolean;
  onApproveStart: () => void;
  onApproveSuccess: (
    eventRequestId: number,
  ) => Promise<unknown> | unknown;
  onConflict: (
    eventRequestId: number,
    conflict: ApproveConflictResult,
  ) => void;
  onForcedApprovalStart: () => void;
  onForcedApprovalSuccess: () => void;
  refreshInvalidStatus: (
    error: unknown,
    eventRequestId: number,
  ) => Promise<void>;
  releaseMutation: () => void;
}

export interface UseApproveEventRequestResult {
  approveError: string;
  approveEventRequestAnyway: (
    eventRequestId: number,
  ) => Promise<ApproveEventRequestResult | null>;
  approveEventRequestById: (
    eventRequestId: number,
  ) => Promise<ApproveEventRequestResult | null>;
  clearApproveError: () => void;
  clearForcedApproveError: () => void;
  forcedApproveError: string;
  isApproving: boolean;
}

export function useApproveEventRequest({
  acquireMutation,
  conflictFallbackMessage,
  fallbackMessage,
  getErrorMessage,
  isCurrentPendingRequest,
  isCurrentRequest,
  onApproveStart,
  onApproveSuccess,
  onConflict,
  onForcedApprovalStart,
  onForcedApprovalSuccess,
  refreshInvalidStatus,
  releaseMutation,
}: UseApproveEventRequestOptions): UseApproveEventRequestResult {
  const [approveError, setApproveError] = useState("");
  const [forcedApproveError, setForcedApproveError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const isApprovingRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isApprovingRef.current = false;
      isMountedRef.current = false;
    };
  }, []);

  const approveEventRequestById = useCallback(
    async (
      eventRequestId: number,
    ): Promise<ApproveEventRequestResult | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        !acquireMutation(eventRequestId)
      ) {
        return null;
      }

      isApprovingRef.current = true;
      onApproveStart();
      setApproveError("");
      setForcedApproveError("");
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

          onConflict(eventRequestId, result);
          return result;
        }

        await onApproveSuccess(eventRequestId);

        return isMountedRef.current && isCurrentRequest(eventRequestId)
          ? result
          : null;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
          setApproveError(getErrorMessage(requestError, fallbackMessage));
        }

        return null;
      } finally {
        isApprovingRef.current = false;
        releaseMutation();

        if (isMountedRef.current) {
          setIsApproving(false);
        }
      }
    },
    [
      acquireMutation,
      fallbackMessage,
      getErrorMessage,
      isCurrentPendingRequest,
      isCurrentRequest,
      onApproveStart,
      onApproveSuccess,
      onConflict,
      refreshInvalidStatus,
      releaseMutation,
    ],
  );

  const approveEventRequestAnyway = useCallback(
    async (
      eventRequestId: number,
    ): Promise<ApproveEventRequestResult | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        !acquireMutation(eventRequestId)
      ) {
        return null;
      }

      isApprovingRef.current = true;
      onForcedApprovalStart();
      setForcedApproveError("");
      setIsApproving(true);

      try {
        const result = await approveEventRequest(eventRequestId, {
          force: true,
        });

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        if (result.kind !== "approved") {
          setForcedApproveError(
            result.message || conflictFallbackMessage,
          );
          return null;
        }

        await onApproveSuccess(eventRequestId);

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        onForcedApprovalSuccess();
        setForcedApproveError("");
        return result;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
          setForcedApproveError(
            getErrorMessage(requestError, fallbackMessage),
          );
        }

        return null;
      } finally {
        isApprovingRef.current = false;
        releaseMutation();

        if (isMountedRef.current) {
          setIsApproving(false);
        }
      }
    },
    [
      acquireMutation,
      conflictFallbackMessage,
      fallbackMessage,
      getErrorMessage,
      isCurrentRequest,
      onApproveSuccess,
      onForcedApprovalStart,
      onForcedApprovalSuccess,
      refreshInvalidStatus,
      releaseMutation,
    ],
  );

  const clearApproveError = useCallback(() => {
    if (isMountedRef.current) {
      setApproveError("");
    }
  }, []);

  const clearForcedApproveError = useCallback(() => {
    if (isMountedRef.current) {
      setForcedApproveError("");
    }
  }, []);

  return {
    approveError,
    approveEventRequestAnyway,
    approveEventRequestById,
    clearApproveError,
    clearForcedApproveError,
    forcedApproveError,
    isApproving,
  };
}
