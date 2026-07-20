import { useCallback, useEffect, useRef, useState } from "react";
import {
  approveBoothRequest,
  rejectBoothRequest,
} from "../api/boothRequestActionsApi";
import type {
  ApproveBoothRequestResponse,
  BoothRequestActionResponse,
} from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export type UseBoothRequestActionsOptions = {
  approveFallbackMessage?: string;
  onApproveSuccess?: () => Promise<unknown> | unknown;
  onRejectSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage?: string;
};

export function useBoothRequestActions({
  approveFallbackMessage = "Unable to approve booth request.",
  onApproveSuccess,
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject booth request.",
}: UseBoothRequestActionsOptions = {}) {
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const isMountedRef = useRef(false);
  const isApprovingRef = useRef(false);
  const isRejectingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isApprovingRef.current = false;
      isRejectingRef.current = false;
    };
  }, []);

  const approveBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<ApproveBoothRequestResponse | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        isRejectingRef.current
      ) {
        return null;
      }

      isApprovingRef.current = true;

      if (isMountedRef.current) {
        setApproveError("");
        setIsApproving(true);
      }

      try {
        const response = await approveBoothRequest(boothRequestId);

        if (!isMountedRef.current) {
          return null;
        }

        await onApproveSuccess?.();

        return isMountedRef.current ? response : null;
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

  const rejectBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<BoothRequestActionResponse | null> => {
      if (
        !isMountedRef.current ||
        isRejectingRef.current ||
        isApprovingRef.current
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
    approveBoothRequestById,
    approveError,
    clearApproveError,
    clearRejectError,
    isApproving,
    isRejecting,
    rejectBoothRequestById,
    rejectError,
  };
}
