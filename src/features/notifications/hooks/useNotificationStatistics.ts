import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getNotificationStatistics } from "../api";
import type { NotificationStatisticsData } from "../types";

export interface NotificationStatisticsState {
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  statistics: NotificationStatisticsData | null;
}

const initialStatisticsState: NotificationStatisticsState = {
  error: "",
  isLoading: true,
  isRefreshing: false,
  statistics: null,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useNotificationStatistics(errorFallback: string) {
  const [state, setState] = useState<NotificationStatisticsState>(
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
      const statistics = await getNotificationStatistics(controller.signal);

      if (requestId === requestIdRef.current) {
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

      if (requestId === requestIdRef.current) {
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
