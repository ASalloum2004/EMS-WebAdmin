import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { markNotificationRead } from "../api";
import type { MarkNotificationReadResponse } from "../types";

interface UseMarkNotificationReadOptions {
  errorFallback: string;
  onSuccess?: () => Promise<unknown> | unknown;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useMarkNotificationRead({
  errorFallback,
  onSuccess,
}: UseMarkNotificationReadOptions) {
  const [error, setError] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState<
    string | null
  >(null);
  const isSubmittingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isSubmittingRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const markAsRead = useCallback(
    async (
      notificationId: string,
    ): Promise<MarkNotificationReadResponse | null> => {
      if (!isMountedRef.current || isSubmittingRef.current) {
        return null;
      }

      const controller = new AbortController();
      isSubmittingRef.current = true;
      controllerRef.current = controller;
      setError("");
      setMarkingNotificationId(notificationId);

      try {
        const response = await markNotificationRead(notificationId, controller.signal);

        if (!isMountedRef.current) {
          return null;
        }

        await onSuccess?.();

        return isMountedRef.current ? response : null;
      } catch (actionError) {
        if (!isAbortError(actionError) && isMountedRef.current) {
          setError(getErrorMessage(actionError, errorFallback));
        }

        return null;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }

        isSubmittingRef.current = false;

        if (isMountedRef.current) {
          setMarkingNotificationId(null);
        }
      }
    },
    [errorFallback, onSuccess],
  );

  return {
    error,
    markingNotificationId,
    markAsRead,
  };
}
