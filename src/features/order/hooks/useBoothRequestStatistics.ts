import { useCallback, useEffect, useRef, useState } from "react";
import { getBoothRequestStatistics } from "../api";
import type { BoothRequestStatisticsData } from "../types";

export type BoothRequestStatisticsState = {
  error: string;
  isLoading: boolean;
  statistics: BoothRequestStatisticsData | null;
};

const initialStatisticsState: BoothRequestStatisticsState = {
  error: "",
  isLoading: false,
  statistics: null,
};

export function getBoothRequestStatisticsLoadingState(
  currentState: BoothRequestStatisticsState,
): BoothRequestStatisticsState {
  return {
    ...currentState,
    error: "",
    isLoading: true,
  };
}

export function getBoothRequestStatisticsSuccessState(
  statistics: BoothRequestStatisticsData,
): BoothRequestStatisticsState {
  return {
    error: "",
    isLoading: false,
    statistics,
  };
}

export function getBoothRequestStatisticsFailureState(
  error: string,
): BoothRequestStatisticsState {
  return {
    error,
    isLoading: false,
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
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState(getBoothRequestStatisticsLoadingState);

    try {
      const statistics = await getBoothRequestStatistics();

      if (
        isLatestBoothRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        setState(getBoothRequestStatisticsSuccessState(statistics));
      }

      return statistics;
    } catch (statisticsError) {
      if (
        isLatestBoothRequestStatisticsRequest(
          requestId,
          requestIdRef.current,
        )
      ) {
        setState(
          getBoothRequestStatisticsFailureState(
            getErrorMessage(
              statisticsError,
              "Unable to load booth request statistics.",
            ),
          ),
        );
      }

      return null;
    }
  }, []);

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
