import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { deleteNotification as deleteNotificationRequest } from "../api";
import type { DeleteNotificationResponse } from "../types";

interface UseDeleteNotificationOptions {
  errorFallback: string;
  onSuccess?: () => Promise<unknown> | unknown;
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useDeleteNotification({
  errorFallback,
  onSuccess,
}: UseDeleteNotificationOptions) {
  const [deletingNotificationId, setDeletingNotificationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      isSubmittingRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const deleteNotification = useCallback(
    async (
      notificationId: string,
    ): Promise<DeleteNotificationResponse | null> => {
      if (!isMountedRef.current || isSubmittingRef.current) {
        return null;
      }

      const controller = new AbortController();
      isSubmittingRef.current = true;
      controllerRef.current = controller;
      setDeletingNotificationId(notificationId);
      setError("");

      try {
        const response = await deleteNotificationRequest(
          notificationId,
          controller.signal,
        );

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
          setDeletingNotificationId(null);
        }
      }
    },
    [errorFallback, onSuccess],
  );
  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    clearError,
    deleteNotification,
    deletingNotificationId,
    error,
  };
}
