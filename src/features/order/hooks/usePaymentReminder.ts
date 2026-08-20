import { useCallback, useEffect, useRef, useState } from "react";
import {
  sendBoothPaymentReminder,
  sendEventPaymentReminder,
} from "../api/paymentReminderApi";
import type { BoothRequestActionResponse } from "../types";

type RequestKind = "booth" | "event";

type UsePaymentReminderOptions = {
  fallbackMessage: string;
  requestId: number | null;
  requestKind: RequestKind;
  requestStatus: string | null | undefined;
};

export function usePaymentReminder({
  fallbackMessage,
  requestId,
  requestKind,
  requestStatus,
}: UsePaymentReminderOptions) {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isMountedRef = useRef(true);
  const isSendingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNoticeTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNoticeDismissal = useCallback(() => {
    clearNoticeTimer();
    timeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setError("");
      setSuccessMessage("");
      timeoutRef.current = null;
    }, 3000);
  }, [clearNoticeTimer]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearNoticeTimer();
    };
  }, [clearNoticeTimer]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const send = useCallback(async (): Promise<BoothRequestActionResponse | null> => {
    if (
      requestId === null ||
      requestStatus?.trim().toLowerCase() !== "pending" ||
      isSendingRef.current
    ) {
      return null;
    }

    isSendingRef.current = true;
    setIsSending(true);
    setError("");
    setSuccessMessage("");
    clearNoticeTimer();

    try {
      const response = requestKind === "booth"
        ? await sendBoothPaymentReminder(requestId)
        : await sendEventPaymentReminder(requestId);

      if (isMountedRef.current) {
        setSuccessMessage(response.message);
        scheduleNoticeDismissal();
      }
      return response;
    } catch (requestError) {
      if (isMountedRef.current) {
        setError(
          requestError instanceof Error && requestError.message.trim()
            ? requestError.message.trim()
            : fallbackMessage,
        );
        scheduleNoticeDismissal();
      }
      return null;
    } finally {
      isSendingRef.current = false;
      if (isMountedRef.current) setIsSending(false);
    }
  }, [
    clearNoticeTimer,
    fallbackMessage,
    requestId,
    requestKind,
    requestStatus,
    scheduleNoticeDismissal,
  ]);

  return { clearError, error, isSending, send, successMessage };
}
