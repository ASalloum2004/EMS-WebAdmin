import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_BOOTH_REQUESTS_PER_PAGE,
  getBoothRequests,
} from "../api";
import type {
  BoothRequestApiData,
  BoothRequestsPagination,
  GetBoothRequestsResult,
} from "../types";
import {
  getBoothRequestFilterParams,
  useBoothRequestFilters,
} from "./useBoothRequestFilters";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

export function isLatestBoothRequestsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

const initialPagination: BoothRequestsPagination = {
  currentPage: 1,
  perPage: DEFAULT_BOOTH_REQUESTS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

export function useBoothRequests() {
  const [requests, setRequests] = useState<BoothRequestApiData[]>([]);
  const [pagination, setPagination] =
    useState<BoothRequestsPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);
  const filters = useBoothRequestFilters({
    onFiltersChange: resetPagination,
  });
  const filterParams = getBoothRequestFilterParams(filters.appliedFilters);
  const createdDate = filterParams.createdDate;
  const sort = filterParams.sort;
  const status = filterParams.status;

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setError("");
    setIsLoading(true);

    try {
      const result = await getBoothRequests({
        createdDate,
        page: currentPage,
        perPage,
        sort,
        status,
      });

      if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
        setRequests(result.requests);
        setPagination(result.pagination);
      }

      return result;
    } catch (requestError) {
      const preservedResult = {
        requests: [],
        pagination: {
          currentPage,
          perPage,
          totalItems: 0,
          totalPages: 1,
        },
      } satisfies GetBoothRequestsResult;

      if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
        setError(
          getErrorMessage(requestError, "Failed to load booth requests."),
        );
        setRequests([]);
      }

      return preservedResult;
    } finally {
      if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
        setIsLoading(false);
      }
    }
  }, [createdDate, currentPage, perPage, sort, status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const setCurrentPage = useCallback(
    (page: number) => {
      const nextPage = Math.min(
        clampPositiveInteger(page),
        pagination.totalPages,
      );

      setPagination((currentPagination) => ({
        ...currentPagination,
        currentPage: nextPage,
      }));
    },
    [pagination.totalPages],
  );

  return {
    currentPage: pagination.currentPage,
    error,
    filters,
    isLoading,
    perPage: pagination.perPage,
    refetch,
    requests,
    setCurrentPage,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
