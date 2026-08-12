import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getReportDetails } from "../api";
import type { ReportDetails } from "../types";

type ReportDetailsState = {
  details: ReportDetails | null;
  error: string;
  isLoading: boolean;
  reportId: number | null;
};

const initialDetailsState: ReportDetailsState = {
  details: null,
  error: "",
  isLoading: false,
  reportId: null,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function isLatestReportDetailsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useReportDetails(
  reportId: number | null,
  errorFallback: string,
) {
  const [state, setState] = useState<ReportDetailsState>(initialDetailsState);
  const activeRequestRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastAutomaticallyRequestedIdRef = useRef<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const selectedReportIdRef = useRef(reportId);
  selectedReportIdRef.current = reportId;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, []);

  const loadDetails = useCallback(
    async (requestedId: number) => {
      activeRequestRef.current?.abort();

      const controller = new AbortController();
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      activeRequestRef.current = controller;
      setState({
        details: null,
        error: "",
        isLoading: true,
        reportId: requestedId,
      });

      try {
        const details = await getReportDetails(
          requestedId,
          controller.signal,
        );

        if (
          isMountedRef.current &&
          selectedReportIdRef.current === requestedId &&
          isLatestReportDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setState({
            details,
            error: "",
            isLoading: false,
            reportId: requestedId,
          });
        }

        return details;
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return null;
        }

        if (
          isMountedRef.current &&
          selectedReportIdRef.current === requestedId &&
          isLatestReportDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setState({
            details: null,
            error: getErrorMessage(requestError, errorFallback),
            isLoading: false,
            reportId: requestedId,
          });
        }

        return null;
      } finally {
        if (requestId === latestRequestIdRef.current) {
          activeRequestRef.current = null;
        }
      }
    },
    [errorFallback],
  );

  useEffect(() => {
    if (reportId === null) {
      lastAutomaticallyRequestedIdRef.current = null;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setState((currentState) =>
        currentState.reportId === null &&
        currentState.details === null &&
        !currentState.error &&
        !currentState.isLoading
          ? currentState
          : initialDetailsState,
      );
      return;
    }

    if (lastAutomaticallyRequestedIdRef.current === reportId) {
      return;
    }

    lastAutomaticallyRequestedIdRef.current = reportId;
    void loadDetails(reportId);
  }, [loadDetails, reportId]);

  const refetch = useCallback(() => {
    if (reportId === null) {
      return Promise.resolve(null);
    }

    lastAutomaticallyRequestedIdRef.current = reportId;
    return loadDetails(reportId);
  }, [loadDetails, reportId]);

  const hasCurrentState =
    reportId !== null && state.reportId === reportId;

  return {
    details: hasCurrentState ? state.details : null,
    error: hasCurrentState ? state.error : "",
    isLoading: reportId !== null && (!hasCurrentState || state.isLoading),
    refetch,
  };
}
