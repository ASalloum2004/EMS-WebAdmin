import { useCallback, useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError("");
    setIsLoading(true);

    try {
      const result = await getServices({
        isActive,
        maxPrice,
        minPrice,
        name: searchName,
        page: currentPage,
        perPage,
        sort,
      });

      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        setServices(result.services);
        onResult?.(result);
      }

      return result;
    } catch (servicesError) {
      const emptyResult = {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;

      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        setError(getErrorMessage(servicesError, "Failed to load services."));
        setServices([]);
        onResult?.(emptyResult);
      }

      return emptyResult;
    } finally {
      if (isLatestServicesRequest(requestId, requestIdRef.current)) {
        setIsLoading(false);
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
  ]);

  const clearListError = useCallback(() => {
    setError("");
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refetch();
  }, [enabled, refetch]);

  return {
    services,
    isLoading,
    error,
    refetch,
    clearListError,
  };
}
