import { useCallback, useEffect, useRef, useState } from "react";
import { approveBoothRequest } from "../../api/boothRequestActionsApi";
import type {
  ApproveBoothRequestConflictState,
  ApproveBoothRequestResult,
} from "../../types";

type ApproveConflictResult = Extract<
  ApproveBoothRequestResult,
  { kind: "conflict" }
>;

export interface UseBoothRequestApprovalConflictsOptions {
  acquireMutation: () => boolean;
  fallbackMessage: string;
  isMutationActive: () => boolean;
  onApproveSuccess?: () => Promise<unknown> | unknown;
  releaseMutation: () => void;
}

export interface UseBoothRequestApprovalConflictsResult {
  approveConflict: ApproveBoothRequestConflictState | null;
  approveConflictError: string;
  clearApproveConflictError: () => void;
  closeApproveConflict: (onClose?: () => void) => boolean;
  isLoadingApproveConflicts: boolean;
  loadApproveConflictPage: (
    page: number,
    onLoadStart?: () => void,
  ) => Promise<ApproveBoothRequestResult | null>;
  openApproveConflict: (
    boothRequestId: number,
    conflict: ApproveConflictResult,
  ) => void;
  resetApproveConflict: () => void;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useBoothRequestApprovalConflicts({
  acquireMutation,
  fallbackMessage,
  isMutationActive,
  onApproveSuccess,
  releaseMutation,
}: UseBoothRequestApprovalConflictsOptions): UseBoothRequestApprovalConflictsResult {
  const [approveConflict, setApproveConflict] =
    useState<ApproveBoothRequestConflictState | null>(null);
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
    (boothRequestId: number, conflict: ApproveConflictResult) => {
      if (!isMountedRef.current) {
        return;
      }

      setApproveConflict({
        message: conflict.message,
        meta: conflict.meta,
        requestId: boothRequestId,
        requests: conflict.requests,
      });
      setApproveConflictError("");
    },
    [],
  );

  const closeApproveConflict = useCallback((onClose?: () => void) => {
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
  }, [isMutationActive]);

  const loadApproveConflictPage = useCallback(
    async (
      page: number,
      onLoadStart?: () => void,
    ): Promise<ApproveBoothRequestResult | null> => {
      if (
        !isMountedRef.current ||
        !approveConflict ||
        page === approveConflict.meta.current_page ||
        isLoadingApproveConflictsRef.current ||
        !acquireMutation()
      ) {
        return null;
      }

      const boothRequestId = approveConflict.requestId;
      isLoadingApproveConflictsRef.current = true;
      onLoadStart?.();
      setApproveConflictError("");
      setIsLoadingApproveConflicts(true);

      try {
        const result = await approveBoothRequest(boothRequestId, {
          force: false,
          page,
        });

        if (!isMountedRef.current) {
          return null;
        }

        if (result.kind === "conflict") {
          setApproveConflict({
            message: result.message,
            meta: result.meta,
            requestId: boothRequestId,
            requests: result.requests,
          });

          return result;
        }

        await onApproveSuccess?.();

        if (!isMountedRef.current) {
          return null;
        }

        setApproveConflict(null);

        return result;
      } catch (requestError) {
        if (isMountedRef.current) {
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
      onApproveSuccess,
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
