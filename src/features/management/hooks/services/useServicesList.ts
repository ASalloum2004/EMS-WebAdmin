import { useCallback, useEffect, useState } from "react";
import { getServices } from "../../api";
import type { GetServicesResult, ServiceApiData } from "../../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

type UseServicesListOptions = {
  currentPage: number;
  enabled?: boolean;
  onResult?: (result: GetServicesResult) => void;
  perPage: number;
  searchName: string;
  sort?: string;
};

export function useServicesList({
  currentPage,
  enabled = true,
  onResult,
  perPage,
  searchName,
  sort = "",
}: UseServicesListOptions) {
  const [services, setServices] = useState<ServiceApiData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!enabled) {
      return {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await getServices({
        name: searchName,
        page: currentPage,
        perPage,
        sort,
      });

      setServices(result.services);
      onResult?.(result);

      return result;
    } catch (servicesError) {
      setError(getErrorMessage(servicesError, "Failed to load services."));
      setServices([]);

      const emptyResult = {
        services: [],
        pagination: {},
      } satisfies GetServicesResult;
      onResult?.(emptyResult);

      return emptyResult;
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, enabled, onResult, perPage, searchName, sort]);

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
