import { useCallback, useEffect, useRef, useState } from "react";
import { cancelBoothRequest } from "../../api/boothRequestActionsApi";
import type { BoothRequestActionResponse } from "../../types";

export interface UseCancelBoothRequestOptions {
  acquireMutation: () => boolean;
  fallbackMessage: string;
  onCancelSuccess?: () => Promise<unknown> | unknown;
  releaseMutation: () => void;
}

export interface UseCancelBoothRequestResult {
    cancelBoothRequestById: (boothId: number) => Promise<BoothRequestActionResponse | null>;

  cancelError: string;
  clearCancelError: () => void;
  isCancelling: boolean;
}

export function useCancelBoothRequest({
  acquireMutation,
  fallbackMessage,
  onCancelSuccess,
  releaseMutation,
}: UseCancelBoothRequestOptions): UseCancelBoothRequestResult {
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const isMountedRef = useRef(false);
  const isCancellingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      isCancellingRef.current = false;
    };
  }, []);

    const cancelBoothRequestById = useCallback(async (boothId: number) => {
    if (!isMountedRef.current || isCancellingRef.current || !acquireMutation()) return null;
    isCancellingRef.current = true;
    setCancelError("");
    setIsCancelling(true);
    try {
      const response = await cancelBoothRequest(boothId);

      if (!isMountedRef.current) return null;
      await onCancelSuccess?.();
      return isMountedRef.current ? response : null;
    } catch (requestError) {
      if (isMountedRef.current) {
        setCancelError(requestError instanceof Error ? requestError.message : fallbackMessage);
      }
      return null;
    } finally {
      isCancellingRef.current = false;
      releaseMutation();
      if (isMountedRef.current) setIsCancelling(false);
    }
  }, [acquireMutation, fallbackMessage, onCancelSuccess, releaseMutation]);

  const clearCancelError = useCallback(() => {
    if (isMountedRef.current) setCancelError("");
  }, []);

  return { cancelBoothRequestById, cancelError, clearCancelError, isCancelling };
}


