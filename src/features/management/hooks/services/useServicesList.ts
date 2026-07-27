import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../../api";
import { getServices } from "../../api";
import type { GetServicesResult, ServiceApiData } from "../../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function isLatestServicesRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

interface ActiveServicesRequest {
  controller: AbortController;
  key: string;
}

type UseServicesListOptions = {
  currentPage: number;
  enabled?: boolean;
  isActive?: boolean;
  maxPrice?: number;
  minPrice?: number;
  onResult?: (result: GetServicesResult) => void;
  perPage: number;
  searchName: string;
  sort?: string;
};

export function useServicesList({
  currentPage,
  enabled = true,
  isActive,
  maxPrice,
  minPrice,
  onResult,
  perPage,
  searchName,
  sort,
}: UseServicesListOptions) {
  const [services, setServices] = useState<ServiceApiData[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveServicesRequest | null>(null);
  const hasLoadedRef = useRef(false);
  const requestKey = JSON.stringify({
    currentPage,
    isActive,
    maxPrice,
    minPrice,
    perPage,
    searchName,
    sort,
  });

  const refetch = useCallback(async () => {
    if (!enabled) {
      return {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;
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
      const result = await getServices(
        {
          isActive,
          maxPrice,
          minPrice,
          name: searchName,
          page: currentPage,
          perPage,
          sort,
        },
        controller.signal,
      );

      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        hasLoadedRef.current = true;
        setServices(result.services);
        onResult?.(result);
      }

      return result;
    } catch (servicesError) {
      const emptyResult = {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;

      if (isAbortError(servicesError)) {
        return emptyResult;
      }

      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        setError(getErrorMessage(servicesError, "Failed to load services."));

        if (!hasLoadedRef.current) {
          setServices([]);
          onResult?.(emptyResult);
        }
      }

      return emptyResult;
    } finally {
      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        activeRequestRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [
    currentPage,
    enabled,
    isActive,
    maxPrice,
    minPrice,
    onResult,
    perPage,
    searchName,
    sort,
    requestKey,
  ]);

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
    services,
    isLoading,
    isRefreshing,
    error,
    refetch,
    clearListError,
  };
}
