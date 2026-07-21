import { useCallback, useEffect, useRef, useState } from "react";
import { rejectEventRequest } from "../../api/eventRequestActionsApi";
import type { EventRequestActionResponse } from "../../types";

export interface UseRejectEventRequestOptions {
  acquireMutation: (eventRequestId: number) => boolean;
  fallbackMessage: string;
  getErrorMessage: (error: unknown, fallbackMessage: string) => string;
  isCurrentRequest: (eventRequestId: number) => boolean;
  onRejectSuccess: (
    eventRequestId: number,
  ) => Promise<unknown> | unknown;
  refreshInvalidStatus: (
    error: unknown,
    eventRequestId: number,
  ) => Promise<void>;
  releaseMutation: () => void;
}

export interface UseRejectEventRequestResult {
  clearRejectError: () => void;
  isRejecting: boolean;
  rejectError: string;
  rejectEventRequestById: (
    eventRequestId: number,
  ) => Promise<EventRequestActionResponse | null>;
}

export function useRejectEventRequest({
  acquireMutation,
  fallbackMessage,
  getErrorMessage,
  isCurrentRequest,
  onRejectSuccess,
  refreshInvalidStatus,
  releaseMutation,
}: UseRejectEventRequestOptions): UseRejectEventRequestResult {
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

  const rejectEventRequestById = useCallback(
    async (
      eventRequestId: number,
    ): Promise<EventRequestActionResponse | null> => {
      if (
        !isMountedRef.current ||
        isRejectingRef.current ||
        !acquireMutation(eventRequestId)
      ) {
        return null;
      }

      isRejectingRef.current = true;
      setRejectError("");
      setIsRejecting(true);

      try {
        const response = await rejectEventRequest(eventRequestId);

        if (!isMountedRef.current || !isCurrentRequest(eventRequestId)) {
          return null;
        }

        await onRejectSuccess(eventRequestId);

        return isMountedRef.current && isCurrentRequest(eventRequestId)
          ? response
          : null;
      } catch (requestError) {
        await refreshInvalidStatus(requestError, eventRequestId);

        if (isMountedRef.current && isCurrentRequest(eventRequestId)) {
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
    [
      acquireMutation,
      fallbackMessage,
      getErrorMessage,
      isCurrentRequest,
      onRejectSuccess,
      refreshInvalidStatus,
      releaseMutation,
    ],
  );

  const clearRejectError = useCallback(() => {
    if (isMountedRef.current) {
      setRejectError("");
    }
  }, []);

  return {
    clearRejectError,
    isRejecting,
    rejectError,
    rejectEventRequestById,
  };
}
