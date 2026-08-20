import { useCallback, useEffect, useRef, useState } from "react";
import { cancelEventRequest } from "../../api/eventRequestActionsApi";
import type { EventRequestActionResponse } from "../../types";

export interface UseCancelEventRequestOptions {
  acquireMutation: () => boolean;
  fallbackMessage: string;
  onCancelSuccess?: () => Promise<unknown> | unknown;
  releaseMutation: () => void;
}

export interface UseCancelEventRequestResult {
  cancelEventRequestById: (eventRequestId: number) => Promise<EventRequestActionResponse | null>;
  cancelError: string;
  clearCancelError: () => void;
  isCancelling: boolean;
}

export function useCancelEventRequest({
  acquireMutation,
  fallbackMessage,
  onCancelSuccess,
  releaseMutation,
}: UseCancelEventRequestOptions): UseCancelEventRequestResult {
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

  const cancelEventRequestById = useCallback(async (eventRequestId: number) => {
    if (!isMountedRef.current || isCancellingRef.current || !acquireMutation()) return null;
    isCancellingRef.current = true;
    setCancelError("");
    setIsCancelling(true);
    try {
      const response = await cancelEventRequest(eventRequestId);
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

  return { cancelEventRequestById, cancelError, clearCancelError, isCancelling };
}
