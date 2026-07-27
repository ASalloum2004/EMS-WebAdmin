import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getEventRequestStatistics } from "../api";
import type { EventRequestStatsData } from "../types";

export interface EventRequestStatisticsState {
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  statistics: EventRequestStatsData | null;
}

interface UseEventRequestStatisticsOptions {
  enabled?: boolean;
  errorFallback: string;
}

const initialStatisticsState: EventRequestStatisticsState = {
  error: "",
  isLoading: false,
  isRefreshing: false,
  statistics: null,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function isLatestEventRequestStatisticsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useEventRequestStatistics({
  enabled = true,
  errorFallback,
}: UseEventRequestStatisticsOptions) {
  const [state, setState] = useState<EventRequestStatisticsState>(
    initialStatisticsState,
  );
  const hasRequestedStatistics = useRef(false);
  const hasLoadedStatistics = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const errorFallbackRef = useRef(errorFallback);
  const requestIdRef = useRef(0);
  errorFallbackRef.current = errorFallback;

  const refetch = useCallback(async () => {
    if (!enabled) {
      return null;
    }

    hasRequestedStatistics.current = true;
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
      const statistics = await getEventRequestStatistics(controller.signal);

      if (
        isLatestEventRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        hasLoadedStatistics.current = true;
        setState({
          error: "",
          isLoading: false,
          isRefreshing: false,
          statistics,
        });
      }

      return statistics;
    } catch (statisticsError) {
      if (isAbortError(statisticsError)) {
        return null;
      }

      if (
        isLatestEventRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        hasLoadedStatistics.current = false;
        setState({
          error: getErrorMessage(statisticsError, errorFallbackRef.current),
          isLoading: false,
          isRefreshing: false,
          statistics: null,
        });
      }

      return null;
    } finally {
      if (
        isLatestEventRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        activeRequestRef.current = null;
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          isRefreshing: false,
        }));
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      hasRequestedStatistics.current = false;
      hasLoadedStatistics.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setState(initialStatisticsState);
      return;
    }

    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (disposedBeforeStart || hasRequestedStatistics.current) {
        return;
      }

      void refetch();
    });

    return () => {
      disposedBeforeStart = true;
      requestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [enabled, refetch]);

  return {
    ...state,
    isInitialLoading:
      enabled &&
      !state.error &&
      (!hasRequestedStatistics.current || state.isLoading),
    isLoading: state.isLoading || state.isRefreshing,
    refetch,
  };
}
