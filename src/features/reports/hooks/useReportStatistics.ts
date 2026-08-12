import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getReportStatistics } from "../api";
import type { ReportStatisticsData } from "../types";

export interface ReportStatisticsState {
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  statistics: ReportStatisticsData | null;
}

const initialStatisticsState: ReportStatisticsState = {
  error: "",
  isLoading: true,
  isRefreshing: false,
  statistics: null,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function getReportStatisticsLoadingState(
  currentState: ReportStatisticsState,
): ReportStatisticsState {
  return {
    ...currentState,
    error: "",
    isLoading: true,
    isRefreshing: false,
  };
}

export function getReportStatisticsSuccessState(
  statistics: ReportStatisticsData,
): ReportStatisticsState {
  return {
    error: "",
    isLoading: false,
    isRefreshing: false,
    statistics,
  };
}

export function getReportStatisticsFailureState(
  error: string,
): ReportStatisticsState {
  return {
    error,
    isLoading: false,
    isRefreshing: false,
    statistics: null,
  };
}

export function isLatestReportStatisticsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useReportStatistics(errorFallback: string) {
  const [state, setState] = useState<ReportStatisticsState>(
    initialStatisticsState,
  );
  const hasRequestedStatistics = useRef(false);
  const hasLoadedStatistics = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;
    setState((currentState) => ({
      ...currentState,
      error: "",
      isLoading: !hasLoadedStatistics.current,
      isRefreshing: hasLoadedStatistics.current,
    }));

    try {
      const statistics = await getReportStatistics(controller.signal);

      if (isLatestReportStatisticsRequest(requestId, requestIdRef.current)) {
        hasLoadedStatistics.current = true;
        setState(getReportStatisticsSuccessState(statistics));
      }

      return statistics;
    } catch (statisticsError) {
      if (isAbortError(statisticsError)) {
        return null;
      }

      if (isLatestReportStatisticsRequest(requestId, requestIdRef.current)) {
        setState((currentState) => ({
          error: getErrorMessage(statisticsError, errorFallback),
          isLoading: false,
          isRefreshing: false,
          statistics: hasLoadedStatistics.current
            ? currentState.statistics
            : null,
        }));
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null;
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          isRefreshing: false,
        }));
      }
    }
  }, [errorFallback]);

  useEffect(() => {
    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (disposedBeforeStart || hasRequestedStatistics.current) {
        return;
      }

      hasRequestedStatistics.current = true;
      void refetch();
    });

    return () => {
      disposedBeforeStart = true;
      requestIdRef.current += 1;
      hasRequestedStatistics.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [refetch]);

  return {
    ...state,
    isInitialLoading: state.isLoading,
    isLoading: state.isLoading || state.isRefreshing,
    refetch,
  };
}
