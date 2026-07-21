import { useCallback, useEffect, useRef, useState } from "react";
import { approveEventRequest } from "../../api/eventRequestActionsApi";
import type {
  ApproveEventRequestConflictState,
  ApproveEventRequestResult,
} from "../../types";

type ApproveConflictResult = Extract<
  ApproveEventRequestResult,
  { kind: "conflict" }
>;

export interface UseEventRequestApprovalConflictsOptions {
  acquireMutation: (eventRequestId: number) => boolean;
  fallbackMessage: string;
  getErrorMessage: (error: unknown, fallbackMessage: string) => string;
  isCurrentPendingRequest: (eventRequestId: number) => boolean;
  isCurrentRequest: (eventRequestId: number) => boolean;
  isMutationActive: () => boolean;
  onApproveSuccess: (
    eventRequestId: number,
  ) => Promise<unknown> | unknown;
  refreshInvalidStatus: (
    error: unknown,
    eventRequestId: number,
  ) => Promise<void>;
  releaseMutation: () => void;
}

export interface UseEventRequestApprovalConflictsResult {
  approveConflict: ApproveEventRequestConflictState | null;
  approveConflictError: string;
  clearApproveConflictError: () => void;
  closeApproveConflict: (onClose?: () => void) => boolean;
  isLoadingApproveConflicts: boolean;
  loadApproveConflictPage: (
    page: number,
    onLoadStart?: () => void,
  ) => Promise<ApproveEventRequestResult | null>;
  openApproveConflict: (
    eventRequestId: number,
    conflict: ApproveConflictResult,
  ) => void;
  resetApproveConflict: () => void;
}

export function useEventRequestApprovalConflicts({
  acquireMutation,
  fallbackMessage,
  getErrorMessage,
  isCurrentPendingRequest,
  isCurrentRequest,
  isMutationActive,
  onApproveSuccess,
  refreshInvalidStatus,
  releaseMutation,
}: UseEventRequestApprovalConflictsOptions): UseEventRequestApprovalConflictsResult {
  const [approveConflict, setApproveConflict] =
    useState<ApproveEventRequestConflictState | null>(null);
  const [approveConflictError, setApproveConflictError] = useState("");
  const [isLoadingApproveConflicts, setIsLoadingApproveConflicts] =
    useState(false);
  const isLoadingApproveConflictsRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isLoadingApproveConflictsRef.current = false;
      isMountedRef.current = false;
    };
  }, []);

  const resetApproveConflict = useCallback(() => {
    if (isMountedRef.current) {
      setApproveConflict(null);
      setApproveConflictError("");
    }
  }, []);

  const clearApproveConflictError = useCallback(() => {
    if (isMountedRef.current) {
      setApproveConflictError("");
    }
  }, []);

  const openApproveConflict = useCallback(
    (eventRequestId: number, conflict: ApproveConflictResult) => {
      if (!isMountedRef.current) {
        return;
      }

      setApproveConflict({
        message: conflict.message,
        meta: conflict.meta,
        requestId: eventRequestId,
        requests: conflict.requests,
      });
      setApproveConflictError("");
    },
    [],
  );

  const closeApproveConflict = useCallback(
    (onClose?: () => void) => {
      if (
        !isMountedRef.current ||
        isLoadingApproveConflictsRef.current ||
        isMutationActive()
      ) {
        return false;
      }

      setApproveConflict(null);
      setApproveConflictError("");
      onClose?.();
      return true;
    },
    [isMutationActive],
  );

  const loadApproveConflictPage = useCallback(
    async (
      page: number,
      onLoadStart?: () => void,
    ): Promise<ApproveEventRequestResult | null> => {
      if (
        !isMountedRef.current ||
        !approveConflict ||
        page === approveConflict.meta.current_page ||
        isLoadingApproveConflictsRef.current ||
        !acquireMutation(approveConflict.requestId)
      ) {
        return null;
      }

      const eventRequestId = approveConflict.requestId;
      isLoadingApproveConflictsRef.current = true;
      onLoadStart?.();
      setApproveConflictError("");
      setIsLoadingApproveConflicts(true);

      try {
        const result = await approveEventRequest(eventRequestId, {
          force: false,
          page,
        });

        if (
          !isMountedRef.current ||
          !isCurrentPendingRequest(eventRequestId)
        ) {
          return null;
        }

        if (result.kind === "conflict") {
          setApproveConflict({
            message: result.message,
            meta: result.meta,
            requestId: eventRequestId,
            requests: result.requests,
          });
          return result;
        }

        await onApproveSuccess(eventRequestId);

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        setApproveConflict(null);
        return result;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
          setApproveConflictError(
            getErrorMessage(requestError, fallbackMessage),
          );
        }

        return null;
      } finally {
        isLoadingApproveConflictsRef.current = false;
        releaseMutation();

        if (isMountedRef.current) {
          setIsLoadingApproveConflicts(false);
        }
      }
    },
    [
      acquireMutation,
      approveConflict,
      fallbackMessage,
      getErrorMessage,
      isCurrentPendingRequest,
      isCurrentRequest,
      onApproveSuccess,
      refreshInvalidStatus,
      releaseMutation,
    ],
  );

  return {
    approveConflict,
    approveConflictError,
    clearApproveConflictError,
    closeApproveConflict,
    isLoadingApproveConflicts,
    loadApproveConflictPage,
    openApproveConflict,
    resetApproveConflict,
  };
}
