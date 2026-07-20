import { useCallback, useEffect, useRef, useState } from "react";
import {
  approveBoothRequest,
  rejectBoothRequest,
} from "../api/boothRequestActionsApi";
import type {
  ApproveBoothRequestConflictState,
  ApproveBoothRequestResult,
  BoothRequestActionResponse,
} from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export type UseBoothRequestActionsOptions = {
  approveConflictFallbackMessage?: string;
  approveFallbackMessage?: string;
  onApproveSuccess?: () => Promise<unknown> | unknown;
  onRejectSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage?: string;
};

export function useBoothRequestActions({
  approveConflictFallbackMessage = "Unable to load conflicting requests.",
  approveFallbackMessage = "Unable to approve booth request.",
  onApproveSuccess,
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject booth request.",
}: UseBoothRequestActionsOptions = {}) {
  const [approveConflict, setApproveConflict] =
    useState<ApproveBoothRequestConflictState | null>(null);
  const [approveConflictError, setApproveConflictError] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [isLoadingApproveConflicts, setIsLoadingApproveConflicts] =
    useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const isMountedRef = useRef(false);
  const isApprovingRef = useRef(false);
  const isLoadingApproveConflictsRef = useRef(false);
  const isRejectingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isApprovingRef.current = false;
      isLoadingApproveConflictsRef.current = false;
      isRejectingRef.current = false;
    };
  }, []);

  const approveBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<ApproveBoothRequestResult | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        isLoadingApproveConflictsRef.current ||
        isRejectingRef.current
      ) {
        return null;
      }

      isApprovingRef.current = true;

      if (isMountedRef.current) {
        setApproveConflict(null);
        setApproveConflictError("");
        setApproveError("");
        setIsApproving(true);
      }

      try {
        const result = await approveBoothRequest(boothRequestId, {
          force: false,
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

        return isMountedRef.current ? result : null;
      } catch (requestError) {
        if (isMountedRef.current) {
          setApproveError(getErrorMessage(requestError, approveFallbackMessage));
        }

        return null;
      } finally {
        isApprovingRef.current = false;

        if (isMountedRef.current) {
          setIsApproving(false);
        }
      }
    },
    [approveFallbackMessage, onApproveSuccess],
  );

  const approveBoothRequestAnyway = useCallback(async () => {
    if (
      !isMountedRef.current ||
      !approveConflict ||
      isApprovingRef.current ||
      isLoadingApproveConflictsRef.current ||
      isRejectingRef.current
    ) {
      return null;
    }

    const boothRequestId = approveConflict.requestId;
    isApprovingRef.current = true;
    setApproveConflictError("");
    setIsApproving(true);

    try {
      const result = await approveBoothRequest(boothRequestId, {
        force: true,
      });

      if (!isMountedRef.current) {
        return null;
      }

      if (result.kind !== "approved") {
        setApproveConflictError(result.message || approveFallbackMessage);
        return null;
      }

      await onApproveSuccess?.();

      if (!isMountedRef.current) {
        return null;
      }

      setApproveConflict(null);
      setApproveConflictError("");

      return result;
    } catch (requestError) {
      if (isMountedRef.current) {
        setApproveConflictError(
          getErrorMessage(requestError, approveFallbackMessage),
        );
      }

      return null;
    } finally {
      isApprovingRef.current = false;

      if (isMountedRef.current) {
        setIsApproving(false);
      }
    }
  }, [approveConflict, approveFallbackMessage, onApproveSuccess]);

  const loadApproveConflictPage = useCallback(
    async (page: number): Promise<ApproveBoothRequestResult | null> => {
      if (
        !isMountedRef.current ||
        !approveConflict ||
        page === approveConflict.meta.current_page ||
        isApprovingRef.current ||
        isLoadingApproveConflictsRef.current ||
        isRejectingRef.current
      ) {
        return null;
      }

      const boothRequestId = approveConflict.requestId;
      isLoadingApproveConflictsRef.current = true;
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
            getErrorMessage(requestError, approveConflictFallbackMessage),
          );
        }

        return null;
      } finally {
        isLoadingApproveConflictsRef.current = false;

        if (isMountedRef.current) {
          setIsLoadingApproveConflicts(false);
        }
      }
    },
    [approveConflict, approveConflictFallbackMessage, onApproveSuccess],
  );

  const closeApproveConflict = useCallback(() => {
    if (
      !isMountedRef.current ||
      isApprovingRef.current ||
      isLoadingApproveConflictsRef.current
    ) {
      return;
    }

    setApproveConflict(null);
    setApproveConflictError("");
  }, []);

  const rejectBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<BoothRequestActionResponse | null> => {
      if (
        !isMountedRef.current ||
        isRejectingRef.current ||
        isApprovingRef.current ||
        isLoadingApproveConflictsRef.current
      ) {
        return null;
      }

      isRejectingRef.current = true;

      if (isMountedRef.current) {
        setRejectError("");
        setIsRejecting(true);
      }

      try {
        const response = await rejectBoothRequest(boothRequestId);

        if (!isMountedRef.current) {
          return null;
        }

        await onRejectSuccess?.();

        return isMountedRef.current ? response : null;
      } catch (requestError) {
        if (isMountedRef.current) {
          setRejectError(getErrorMessage(requestError, rejectFallbackMessage));
        }

        return null;
      } finally {
        isRejectingRef.current = false;

        if (isMountedRef.current) {
          setIsRejecting(false);
        }
      }
    },
    [onRejectSuccess, rejectFallbackMessage],
  );

  const clearRejectError = useCallback(() => {
    if (isMountedRef.current) {
      setRejectError("");
    }
  }, []);

  const clearApproveError = useCallback(() => {
    if (isMountedRef.current) {
      setApproveError("");
    }
  }, []);

  return {
    approveBoothRequestAnyway,
    approveBoothRequestById,
    approveConflict,
    approveConflictError,
    approveError,
    closeApproveConflict,
    clearApproveError,
    clearRejectError,
    isApproving,
    isLoadingApproveConflicts,
    isRejecting,
    loadApproveConflictPage,
    rejectBoothRequestById,
    rejectError,
  };
}
