import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError, isAbortError } from "../../../api";
import { rejectReport, resolveReport } from "../api";
import type {
  RejectReportPayload,
  ReportActionFieldErrors,
  ReportActionResponse,
  ResolveReportPayload,
} from "../types";

type ReportAction = "resolve" | "reject";

type ReportActionErrorState = {
  error: string;
  fieldErrors: ReportActionFieldErrors;
};

interface UseReportActionsOptions {
  onActionSuccess?: () => Promise<unknown> | unknown;
  rejectFallbackMessage: string;
  resolveFallbackMessage: string;
}

function getFirstMessage(value: unknown) {
  if (Array.isArray(value)) {
    return value.find(
      (message): message is string =>
        typeof message === "string" && Boolean(message.trim()),
    );
  }

  return typeof value === "string" && value.trim() ? value : undefined;
}

function getActionErrorState(
  error: unknown,
  fallbackMessage: string,
): ReportActionErrorState {
  const notesError =
    error instanceof ApiRequestError
      ? getFirstMessage(error.errors?.notes)
      : undefined;

  return {
    error:
      error instanceof Error && error.message.trim()
        ? error.message
        : fallbackMessage,
    fieldErrors: notesError ? { notes: notesError } : {},
  };
}

export function useReportActions({
  onActionSuccess,
  rejectFallbackMessage,
  resolveFallbackMessage,
}: UseReportActionsOptions) {
  const [activeAction, setActiveAction] = useState<ReportAction | null>(
    null,
  );
  const [resolveError, setResolveError] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [resolveFieldErrors, setResolveFieldErrors] =
    useState<ReportActionFieldErrors>({});
  const [rejectFieldErrors, setRejectFieldErrors] =
    useState<ReportActionFieldErrors>({});
  const activeActionRef = useRef<ReportAction | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      activeActionRef.current = null;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const runAction = useCallback(
    async (
      action: ReportAction,
      reportId: number,
      payload: ResolveReportPayload | RejectReportPayload,
    ): Promise<ReportActionResponse | null> => {
      if (!isMountedRef.current || activeActionRef.current !== null) {
        return null;
      }

      activeActionRef.current = action;
      setActiveAction(action);
      setResolveError("");
      setRejectError("");
      setResolveFieldErrors({});
      setRejectFieldErrors({});

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response =
          action === "resolve"
            ? await resolveReport(reportId, payload, controller.signal)
            : await rejectReport(reportId, payload, controller.signal);

        if (!isMountedRef.current) {
          return null;
        }

        await onActionSuccess?.();

        return isMountedRef.current ? response : null;
      } catch (actionError) {
        if (!isAbortError(actionError) && isMountedRef.current) {
          const errorState = getActionErrorState(
            actionError,
            action === "resolve"
              ? resolveFallbackMessage
              : rejectFallbackMessage,
          );

          if (action === "resolve") {
            setResolveError(errorState.error);
            setResolveFieldErrors(errorState.fieldErrors);
          } else {
            setRejectError(errorState.error);
            setRejectFieldErrors(errorState.fieldErrors);
          }
        }

        return null;
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }

        activeActionRef.current = null;

        if (isMountedRef.current) {
          setActiveAction(null);
        }
      }
    },
    [onActionSuccess, rejectFallbackMessage, resolveFallbackMessage],
  );

  const resolveReportById = useCallback(
    (reportId: number, payload: ResolveReportPayload = {}) =>
      runAction("resolve", reportId, payload),
    [runAction],
  );
  const rejectReportById = useCallback(
    (reportId: number, payload: RejectReportPayload = {}) =>
      runAction("reject", reportId, payload),
    [runAction],
  );
  const clearResolveError = useCallback(() => {
    setResolveError("");
    setResolveFieldErrors({});
  }, []);
  const clearRejectError = useCallback(() => {
    setRejectError("");
    setRejectFieldErrors({});
  }, []);

  return {
    clearRejectError,
    clearResolveError,
    isRejecting: activeAction === "reject",
    isResolving: activeAction === "resolve",
    isSubmitting: activeAction !== null,
    rejectError,
    rejectFieldErrors,
    rejectReportById,
    resolveError,
    resolveFieldErrors,
    resolveReportById,
  };
}
