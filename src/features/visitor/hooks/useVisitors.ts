import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { DEFAULT_VISITORS_PER_PAGE, getVisitors } from "../api";
import type {
  GetVisitorsParams,
  GetVisitorsResult,
  VisitorApiData,
  VisitorPagination,
} from "../types";
import {
  getVisitorFilterParams,
  useVisitorFilters,
} from "./useVisitorFilters";

export const VISITOR_SEARCH_DEBOUNCE_MS = 400;

const initialPagination: VisitorPagination = {
  currentPage: 1,
  perPage: DEFAULT_VISITORS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getRequestKey(params: GetVisitorsParams) {
  return JSON.stringify(params);
}

interface ActiveVisitorsRequest {
  controller: AbortController;
  key: string;
}

export function isLatestVisitorsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useVisitors(errorFallback: string) {
  const [visitors, setVisitors] = useState<VisitorApiData[]>([]);
  const [pagination, setPagination] =
    useState<VisitorPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveVisitorsRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const requestParamsRef = useRef<GetVisitorsParams>({});
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);
  const filters = useVisitorFilters({
    onFiltersChange: resetPagination,
  });
  const filterParams = getVisitorFilterParams(filters.appliedFilters);
  const gender = filterParams.gender;
  const job = filterParams.job;
  const location = filterParams.location;

  useEffect(() => {
    const nextSearch = searchValue.trim();

    if (nextSearch === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
      resetPagination();
    }, VISITOR_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, resetPagination, searchValue]);

  const requestParams = useMemo<GetVisitorsParams>(
    () => ({
      gender,
      job,
      location,
      page: currentPage,
      perPage,
      search: debouncedSearch || undefined,
    }),
    [currentPage, debouncedSearch, gender, job, location, perPage],
  );
  requestParamsRef.current = requestParams;

  const requestVisitors = useCallback(
    async (params: GetVisitorsParams) => {
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
        const result = await getVisitors(params, controller.signal);

        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
          hasLoadedRef.current = true;
          setVisitors(result.visitors);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          visitors: [],
          pagination: {
            currentPage: params.page ?? 1,
            perPage: params.perPage ?? DEFAULT_VISITORS_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
        } satisfies GetVisitorsResult;

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));

          if (!hasLoadedRef.current) {
            setVisitors([]);
          }
        }

        return preservedResult;
      } finally {
        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [errorFallback],
  );

  const refetch = useCallback(
    () => requestVisitors(requestParamsRef.current),
    [requestVisitors],
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
      void requestVisitors(requestParams);
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
  }, [requestParams, requestVisitors]);

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
  const hasActiveCriteria = Boolean(
    debouncedSearch || gender || job || location,
  );

  return {
    currentPage: pagination.currentPage,
    error,
    filters,
    hasActiveCriteria,
    isLoading,
    isRefreshing,
    perPage: pagination.perPage,
    refetch,
    searchValue,
    setCurrentPage,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    visitors,
  };
}
