import { useCallback, useRef, useState } from "react";
import { rejectBoothRequest } from "../api";
import type { BoothRequestActionResponse } from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

type UseBoothRequestMutationsOptions = {
  onRejectSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage?: string;
};

export function useBoothRequestMutations({
  onRejectSuccess,
  rejectFallbackMessage = "Unable to reject booth request.",
}: UseBoothRequestMutationsOptions = {}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");
  const isRejectingRef = useRef(false);

  const rejectBoothRequestById = useCallback(
    async (
      boothRequestId: number,
    ): Promise<BoothRequestActionResponse | null> => {
      if (isRejectingRef.current) {
        return null;
      }

      isRejectingRef.current = true;
      setRejectError("");
      setIsRejecting(true);

      try {
        const response = await rejectBoothRequest(boothRequestId);
        await onRejectSuccess?.();

        return response;
      } catch (requestError) {
        setRejectError(getErrorMessage(requestError, rejectFallbackMessage));

        return null;
      } finally {
        isRejectingRef.current = false;
        setIsRejecting(false);
      }
    },
    [onRejectSuccess, rejectFallbackMessage],
  );

  const clearRejectError = useCallback(() => {
    setRejectError("");
  }, []);

  return {
    clearRejectError,
    isRejecting,
    rejectBoothRequestById,
    rejectError,
  };
}
