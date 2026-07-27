import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getBoothRequestStatistics } from "../api";
import type { BoothRequestStatisticsData } from "../types";

export type BoothRequestStatisticsState = {
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
  statistics: BoothRequestStatisticsData | null;
};

const initialStatisticsState: BoothRequestStatisticsState = {
  error: "",
  isLoading: true,
  isRefreshing: false,
  statistics: null,
};

export function getBoothRequestStatisticsLoadingState(
  currentState: BoothRequestStatisticsState,
): BoothRequestStatisticsState {
  return {
    ...currentState,
    error: "",
    isLoading: true,
    isRefreshing: false,
  };
}

export function getBoothRequestStatisticsSuccessState(
  statistics: BoothRequestStatisticsData,
): BoothRequestStatisticsState {
  return {
    error: "",
    isLoading: false,
    isRefreshing: false,
    statistics,
  };
}

export function getBoothRequestStatisticsFailureState(
  error: string,
): BoothRequestStatisticsState {
  return {
    error,
    isLoading: false,
    isRefreshing: false,
    statistics: null,
  };
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function isLatestBoothRequestStatisticsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useBoothRequestStatistics() {
  const [state, setState] = useState<BoothRequestStatisticsState>(
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
      const statistics = await getBoothRequestStatistics(controller.signal);

      if (
        isLatestBoothRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        hasLoadedStatistics.current = true;
        setState(getBoothRequestStatisticsSuccessState(statistics));
      }

      return statistics;
    } catch (statisticsError) {
      if (isAbortError(statisticsError)) {
        return null;
      }

      if (
        isLatestBoothRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        setState((currentState) => ({
          error: getErrorMessage(
            statisticsError,
            "Unable to load booth request statistics.",
          ),
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
  }, []);

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
      hasLoadedStatistics.current = false;
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
