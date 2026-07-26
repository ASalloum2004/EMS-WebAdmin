import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);
  const automaticRequestKeyRef = useRef<string | null>(null);
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
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const result = await getVisitors(params);

        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
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

        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));
          setVisitors([]);
        }

        return preservedResult;
      } finally {
        if (isLatestVisitorsRequest(requestId, requestIdRef.current)) {
          setIsLoading(false);
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

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestVisitors(requestParams);
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
