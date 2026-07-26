import { useCallback, useEffect, useRef, useState } from "react";
import { getVisitorStatistics } from "../api";
import type { VisitorStatisticsData } from "../types";

export interface VisitorStatisticsState {
  error: string;
  isLoading: boolean;
  statistics: VisitorStatisticsData | null;
}

const initialStatisticsState: VisitorStatisticsState = {
  error: "",
  isLoading: false,
  statistics: null,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function getVisitorStatisticsLoadingState(
  currentState: VisitorStatisticsState,
): VisitorStatisticsState {
  return {
    ...currentState,
    error: "",
    isLoading: true,
  };
}

export function getVisitorStatisticsSuccessState(
  statistics: VisitorStatisticsData,
): VisitorStatisticsState {
  return {
    error: "",
    isLoading: false,
    statistics,
  };
}

export function getVisitorStatisticsFailureState(
  error: string,
): VisitorStatisticsState {
  return {
    error,
    isLoading: false,
    statistics: null,
  };
}

export function isLatestVisitorStatisticsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useVisitorStatistics(errorFallback: string) {
  const [state, setState] = useState<VisitorStatisticsState>(
    initialStatisticsState,
  );
  const hasRequestedStatistics = useRef(false);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState(getVisitorStatisticsLoadingState);

    try {
      const statistics = await getVisitorStatistics();

      if (
        isLatestVisitorStatisticsRequest(requestId, requestIdRef.current)
      ) {
        setState(getVisitorStatisticsSuccessState(statistics));
      }

      return statistics;
    } catch (statisticsError) {
      if (
        isLatestVisitorStatisticsRequest(requestId, requestIdRef.current)
      ) {
        setState(
          getVisitorStatisticsFailureState(
            getErrorMessage(statisticsError, errorFallback),
          ),
        );
      }

      return null;
    }
  }, [errorFallback]);

  useEffect(() => {
    if (hasRequestedStatistics.current) {
      return;
    }

    hasRequestedStatistics.current = true;
    void refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
  };
}
