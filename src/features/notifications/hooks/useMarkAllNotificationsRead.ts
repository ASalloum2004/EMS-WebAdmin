import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { markAllNotificationsRead } from "../api";
import type { MarkAllNotificationsReadResponse } from "../types";

interface UseMarkAllNotificationsReadOptions {
  errorFallback: string;
  onSuccess?: () => Promise<unknown> | unknown;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useMarkAllNotificationsRead({
  errorFallback,
  onSuccess,
}: UseMarkAllNotificationsReadOptions) {
  const [error, setError] = useState("");
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
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

  const markAllAsRead = useCallback(
    async (): Promise<MarkAllNotificationsReadResponse | null> => {
      if (!isMountedRef.current || isSubmittingRef.current) {
        return null;
      }

      const controller = new AbortController();
      isSubmittingRef.current = true;
      controllerRef.current = controller;
      setError("");
      setIsMarkingAllAsRead(true);

      try {
        const response = await markAllNotificationsRead(controller.signal);

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
          setIsMarkingAllAsRead(false);
        }
      }
    },
    [errorFallback, onSuccess],
  );

  return {
    error,
    isMarkingAllAsRead,
    markAllAsRead,
  };
}
