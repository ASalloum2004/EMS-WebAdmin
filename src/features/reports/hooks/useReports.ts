import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { DEFAULT_REPORTS_PER_PAGE, getReports } from "../api";
import type {
  GetReportsParams,
  GetReportsResult,
  ReportsPagination,
} from "../types";
import { getReportFilterParams, useReportFilters } from "./useReportFilters";

export const REPORT_SEARCH_DEBOUNCE_MS = 400;

const initialPagination: ReportsPagination = {
  currentPage: 1,
  perPage: DEFAULT_REPORTS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getRequestKey(params: GetReportsParams) {
  return JSON.stringify(params);
}

interface ActiveReportsRequest {
  controller: AbortController;
  key: string;
}

export function isLatestReportsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useReports(errorFallback: string) {
  const [reports, setReports] = useState<GetReportsResult["reports"]>([]);
  const [pagination, setPagination] =
    useState<ReportsPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveReportsRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const requestParamsRef = useRef<GetReportsParams>({});
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);
  const filters = useReportFilters({ onFiltersChange: resetPagination });
  const { status } = getReportFilterParams(filters.appliedFilters);

  useEffect(() => {
    const nextSearch = searchValue.trim();

    if (nextSearch === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
      resetPagination();
    }, REPORT_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, resetPagination, searchValue]);

  const requestParams = useMemo<GetReportsParams>(
    () => ({
      page: currentPage,
      perPage,
      search: debouncedSearch || undefined,
      status,
    }),
    [currentPage, debouncedSearch, perPage, status],
  );
  requestParamsRef.current = requestParams;

  const requestReports = useCallback(
    async (params: GetReportsParams) => {
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
        const result = await getReports(params, controller.signal);

        if (isLatestReportsRequest(requestId, requestIdRef.current)) {
          hasLoadedRef.current = true;
          setReports(result.reports);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          pagination: {
            currentPage: params.page ?? 1,
            perPage: params.perPage ?? DEFAULT_REPORTS_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
          reports: [],
        } satisfies GetReportsResult;

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (isLatestReportsRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));

          if (!hasLoadedRef.current) {
            setReports([]);
          }
        }

        return preservedResult;
      } finally {
        if (isLatestReportsRequest(requestId, requestIdRef.current)) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [errorFallback],
  );

  const refetch = useCallback(
    () => requestReports(requestParamsRef.current),
    [requestReports],
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
      void requestReports(requestParams);
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
  }, [requestParams, requestReports]);

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
    isLoading:
      isLoading ||
      (!hasLoadedRef.current && automaticRequestKeyRef.current === null),
    isRefreshing,
    perPage: pagination.perPage,
    refetch,
    reports,
    searchValue,
    setCurrentPage,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
