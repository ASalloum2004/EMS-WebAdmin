import { useCallback, useEffect, useRef, useState } from "react";
import { rejectBoothRequest } from "../../api/boothRequestActionsApi";
import type { BoothRequestActionResponse } from "../../types";

export interface UseRejectBoothRequestOptions {
  acquireMutation: () => boolean;
  fallbackMessage: string;
  onRejectSuccess?: () => Promise<unknown> | unknown;
  releaseMutation: () => void;
}

export interface UseRejectBoothRequestResult {
  clearRejectError: () => void;
  isRejecting: boolean;
  rejectBoothRequestById: (
    boothRequestId: number,
  ) => Promise<BoothRequestActionResponse | null>;
  rejectError: string;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useRejectBoothRequest({
  acquireMutation,
  fallbackMessage,
  onRejectSuccess,
  releaseMutation,
}: UseRejectBoothRequestOptions): UseRejectBoothRequestResult {
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
      if (
        !isMountedRef.current ||
        isRejectingRef.current ||
        !acquireMutation()
      ) {
        return null;
      }

      isRejectingRef.current = true;
      setRejectError("");
      setIsRejecting(true);

      try {
        const response = await rejectBoothRequest(boothRequestId);

        if (!isMountedRef.current) {
          return null;
        }

        await onRejectSuccess?.();

        return isMountedRef.current ? response : null;
      } catch (requestError) {
        if (isMountedRef.current) {
          setRejectError(getErrorMessage(requestError, fallbackMessage));
        }

        return null;
      } finally {
        isRejectingRef.current = false;
        releaseMutation();

        if (isMountedRef.current) {
          setIsRejecting(false);
        }
      }
    },
    [acquireMutation, fallbackMessage, onRejectSuccess, releaseMutation],
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
