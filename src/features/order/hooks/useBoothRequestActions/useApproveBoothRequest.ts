import { useCallback, useEffect, useRef, useState } from "react";
import { approveBoothRequest } from "../../api/boothRequestActionsApi";
import type { ApproveBoothRequestResult } from "../../types";

type ApproveConflictResult = Extract<
  ApproveBoothRequestResult,
  { kind: "conflict" }
>;

export interface UseApproveBoothRequestOptions {
  acquireMutation: () => boolean;
  fallbackMessage: string;
  onApproveStart: () => void;
  onConflict: (
    boothRequestId: number,
    conflict: ApproveConflictResult,
  ) => void;
  onForcedApprovalStart: () => void;
  onForcedApprovalSuccess: () => void;
  onApproveSuccess?: () => Promise<unknown> | unknown;
  releaseMutation: () => void;
}

export interface UseApproveBoothRequestResult {
  approveBoothRequestAnyway: (
    boothRequestId: number,
  ) => Promise<ApproveBoothRequestResult | null>;
  approveBoothRequestById: (
    boothRequestId: number,
  ) => Promise<ApproveBoothRequestResult | null>;
  approveError: string;
  clearApproveError: () => void;
  clearForcedApproveError: () => void;
  forcedApproveError: string;
  isApproving: boolean;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useApproveBoothRequest({
  acquireMutation,
  fallbackMessage,
  onApproveStart,
  onConflict,
  onForcedApprovalStart,
  onForcedApprovalSuccess,
  onApproveSuccess,
  releaseMutation,
}: UseApproveBoothRequestOptions): UseApproveBoothRequestResult {
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

  const approveBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<ApproveBoothRequestResult | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        !acquireMutation()
      ) {
        return null;
      }

      isApprovingRef.current = true;
      onApproveStart();
      setApproveError("");
      setForcedApproveError("");
      setIsApproving(true);

      try {
        const result = await approveBoothRequest(boothRequestId, {
          force: false,
        });

        if (!isMountedRef.current) {
          return null;
        }

        if (result.kind === "conflict") {
          onConflict(boothRequestId, result);
          return result;
        }

        await onApproveSuccess?.();

        return isMountedRef.current ? result : null;
      } catch (requestError) {
        if (isMountedRef.current) {
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
      onApproveStart,
      onApproveSuccess,
      onConflict,
      releaseMutation,
    ],
  );

  const approveBoothRequestAnyway = useCallback(
    async (
      boothRequestId: number,
    ): Promise<ApproveBoothRequestResult | null> => {
      if (
        !isMountedRef.current ||
        isApprovingRef.current ||
        !acquireMutation()
      ) {
        return null;
      }

      isApprovingRef.current = true;
      onForcedApprovalStart();
      setForcedApproveError("");
      setIsApproving(true);

      try {
        const result = await approveBoothRequest(boothRequestId, {
          force: true,
        });

        if (!isMountedRef.current) {
          return null;
        }

        if (result.kind !== "approved") {
          setForcedApproveError(result.message || fallbackMessage);
          return null;
        }

        await onApproveSuccess?.();

        if (!isMountedRef.current) {
          return null;
        }

        onForcedApprovalSuccess();
        setForcedApproveError("");

        return result;
      } catch (requestError) {
        if (isMountedRef.current) {
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
      fallbackMessage,
      onApproveSuccess,
      onForcedApprovalStart,
      onForcedApprovalSuccess,
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
    approveBoothRequestAnyway,
    approveBoothRequestById,
    approveError,
    clearApproveError,
    clearForcedApproveError,
    forcedApproveError,
    isApproving,
  };
}
