import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
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

interface ActiveBoothRequestsRequest {
  controller: AbortController;
  key: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedCompanyName, setDebouncedCompanyName] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveBoothRequestsRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
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
      activeRequestRef.current?.controller.abort();

      const controller = new AbortController();
      const requestId = requestIdRef.current + 1;
      const requestKey = getRequestKey(params);
      requestIdRef.current = requestId;
      activeRequestRef.current = { controller, key: requestKey };

      setError("");
      setIsLoading(!hasLoadedRef.current);
      setIsRefreshing(hasLoadedRef.current);

      try {
        const result = await getBoothRequests(params, controller.signal);

        if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
          hasLoadedRef.current = true;
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

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
          setError(
            getErrorMessage(requestError, "Failed to load booth requests."),
          );
          if (!hasLoadedRef.current) {
            setRequests([]);
          }
        }

        return preservedResult;
      } finally {
        if (isLatestBoothRequestsRequest(requestId, requestIdRef.current)) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
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
    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (
        disposedBeforeStart ||
        automaticRequestKeyRef.current === requestKey
      ) {
        return;
      }

      automaticRequestKeyRef.current = requestKey;
      void requestBoothRequests(requestParams);
    });

    return () => {
      disposedBeforeStart = true;
      const activeRequest = activeRequestRef.current;

      if (activeRequest?.key === requestKey) {
        requestIdRef.current += 1;
        activeRequestRef.current = null;
        automaticRequestKeyRef.current = null;
        activeRequest.controller.abort();
      }
    };
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
    isRefreshing,
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
