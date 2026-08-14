import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../../api";
import { getBuses } from "../../api";
import type { BusApiData, GetBusesResult } from "../../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function isLatestBusesRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

interface ActiveBusesRequest {
  controller: AbortController;
  key: string;
}

type UseBusListOptions = {
  currentPage: number;
  enabled?: boolean;
  onResult?: (result: GetBusesResult) => void;
  perPage: number;
  searchLocation: string;
};

export function useBusList({
  currentPage,
  enabled = true,
  onResult,
  perPage,
  searchLocation,
}: UseBusListOptions) {
  const [buses, setBuses] = useState<BusApiData[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveBusesRequest | null>(null);
  const hasLoadedRef = useRef(false);
  const requestKey = JSON.stringify({ currentPage, perPage, searchLocation });

  const refetch = useCallback(async () => {
    if (!enabled) {
      return {
        buses: [],
        pagination: {},
      } satisfies GetBusesResult;
    }

    activeRequestRef.current?.controller.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = { controller, key: requestKey };

    setError("");
    setIsLoading(!hasLoadedRef.current);
    setIsRefreshing(hasLoadedRef.current);

    try {
      const result = await getBuses(
        {
          location: searchLocation,
          page: currentPage,
          perPage,
        },
        controller.signal,
      );

      if (isLatestBusesRequest(requestId, requestIdRef.current)) {
        hasLoadedRef.current = true;
        setBuses(result.buses);
        onResult?.(result);
      }

      return result;
    } catch (busesError) {
      const emptyResult = {
        buses: [],
        pagination: {},
      } satisfies GetBusesResult;

      if (isAbortError(busesError)) {
        return emptyResult;
      }

      if (isLatestBusesRequest(requestId, requestIdRef.current)) {
        setError(getErrorMessage(busesError, "Failed to load buses."));
        setBuses([]);
        onResult?.(emptyResult);
      }

      return emptyResult;
    } finally {
      if (isLatestBusesRequest(requestId, requestIdRef.current)) {
        activeRequestRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [currentPage, enabled, onResult, perPage, requestKey, searchLocation]);

  const clearListError = useCallback(() => {
    setError("");
  }, []);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      activeRequestRef.current?.controller.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (!disposedBeforeStart) {
        void refetch();
      }
    });

    return () => {
      disposedBeforeStart = true;
      const activeRequest = activeRequestRef.current;

      if (activeRequest?.key === requestKey) {
        requestIdRef.current += 1;
        activeRequestRef.current = null;
        activeRequest.controller.abort();
      }
    };
  }, [enabled, refetch, requestKey]);

  return {
    buses,
    isLoading,
    isRefreshing,
    error,
    refetch,
    clearListError,
  };
}
