import { useCallback, useEffect, useRef, useState } from "react";
import { rejectBoothRequest } from "../api/boothRequestActionsApi";
import type { BoothRequestActionResponse } from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export type UseBoothRequestActionsOptions = {
  onRejectSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage?: string;
};

export function useBoothRequestActions({
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject booth request.",
}: UseBoothRequestActionsOptions = {}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const isMountedRef = useRef(false);
  const isRejectingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isRejectingRef.current = false;
    };
  }, []);

  const rejectBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<BoothRequestActionResponse | null> => {
      if (!isMountedRef.current || isRejectingRef.current) {
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

  return {
    clearRejectError,
    isRejecting,
    rejectBoothRequestById,
    rejectError,
  };
}
