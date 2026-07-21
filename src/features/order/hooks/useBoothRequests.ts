import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BOOTH_REQUESTS_PER_PAGE,
  getBoothRequests,
} from "../api";
import type {
  BoothRequestApiData,
  BoothRequestsPagination,
  GetBoothRequestsParams,
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

function getRequestKey(params: GetBoothRequestsParams) {
  return JSON.stringify(params);
}

export function isLatestBoothRequestsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export const BOOTH_REQUEST_SEARCH_DEBOUNCE_MS = 400;

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
  const [searchValue, setSearchValue] = useState("");
  const [debouncedCompanyName, setDebouncedCompanyName] = useState("");
  const requestIdRef = useRef(0);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const requestParamsRef = useRef<GetBoothRequestsParams>({});
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

  useEffect(() => {
    const nextCompanyName = searchValue.trim();

    if (nextCompanyName === debouncedCompanyName) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedCompanyName(nextCompanyName);
      resetPagination();
    }, BOOTH_REQUEST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedCompanyName, resetPagination, searchValue]);

  const requestParams = useMemo<GetBoothRequestsParams>(
    () => ({
      companyName: debouncedCompanyName || undefined,
      createdDate,
      page: currentPage,
      perPage,
      sort,
      status,
    }),
    [
      createdDate,
      currentPage,
      debouncedCompanyName,
      perPage,
      sort,
      status,
    ],
  );
  requestParamsRef.current = requestParams;

  const requestBoothRequests = useCallback(
    async (params: GetBoothRequestsParams) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const result = await getBoothRequests(params);

        if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
          setRequests(result.requests);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          requests: [],
          pagination: {
            currentPage: params.page ?? 1,
            perPage: params.perPage ?? DEFAULT_BOOTH_REQUESTS_PER_PAGE,
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
    },
    [],
  );

  const refetch = useCallback(
    () => requestBoothRequests(requestParamsRef.current),
    [requestBoothRequests],
  );

  useEffect(() => {
    const requestKey = getRequestKey(requestParams);

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestBoothRequests(requestParams);
  }, [requestBoothRequests, requestParams]);

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
    searchValue,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
