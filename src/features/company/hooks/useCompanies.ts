import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { DEFAULT_COMPANIES_PER_PAGE, getCompanies } from "../api";
import type {
  CompanyListItem,
  CompanyPagination,
  GetCompaniesParams,
  GetCompaniesResult,
} from "../types";
import {
  getCompanyFilterParams,
  useCompanyFilters,
} from "./useCompanyFilters";

export const COMPANY_SEARCH_DEBOUNCE_MS = 400;

const initialPagination: CompanyPagination = {
  currentPage: 1,
  perPage: DEFAULT_COMPANIES_PER_PAGE,
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

function getRequestKey(params: GetCompaniesParams) {
  return JSON.stringify(params);
}

interface ActiveCompaniesRequest {
  controller: AbortController;
  key: string;
}

export function isLatestCompaniesRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useCompanies(errorFallback: string, enabled = true) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [pagination, setPagination] =
    useState<CompanyPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveCompaniesRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const wasEnabledRef = useRef(false);
  const requestParamsRef = useRef<GetCompaniesParams>({});
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);
  const filters = useCompanyFilters({
    onFiltersChange: resetPagination,
  });
  const filterParams = getCompanyFilterParams(filters.appliedFilters);
  const businessSector = filterParams.businessSector;
  const status = filterParams.status;

  useEffect(() => {
    const nextSearch = searchValue.trim();

    if (nextSearch === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
      resetPagination();
    }, COMPANY_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, resetPagination, searchValue]);

  const requestParams = useMemo<GetCompaniesParams>(
    () => ({
      businessSector,
      name: debouncedSearch || undefined,
      page: currentPage,
      perPage,
      status,
    }),
    [businessSector, currentPage, debouncedSearch, perPage, status],
  );
  requestParamsRef.current = requestParams;

  const requestCompanies = useCallback(
    async (params: GetCompaniesParams) => {
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
        const result = await getCompanies(params, controller.signal);

        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
          hasLoadedRef.current = true;
          setCompanies(result.companies);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          companies: [],
          pagination: {
            currentPage: params.page ?? 1,
            perPage: DEFAULT_COMPANIES_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
        } satisfies GetCompaniesResult;

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));

          if (!hasLoadedRef.current) {
            setCompanies([]);
          }
        }

        return preservedResult;
      } finally {
        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [errorFallback],
  );

  const refetch = useCallback(
    () => requestCompanies(requestParamsRef.current),
    [requestCompanies],
  );

  useEffect(() => {
    if (!enabled) {
      wasEnabledRef.current = false;
      automaticRequestKeyRef.current = null;
      requestIdRef.current += 1;
      hasLoadedRef.current = false;
      activeRequestRef.current?.controller.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    wasEnabledRef.current = true;
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
      void requestCompanies(requestParams);
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
  }, [enabled, requestCompanies, requestParams]);

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
  const hasActiveFilters = Boolean(businessSector || status);
  const hasActiveCriteria = Boolean(debouncedSearch || hasActiveFilters);

  return {
    companies,
    currentPage: pagination.currentPage,
    error,
    filters,
    hasActiveFilters,
    hasActiveCriteria,
    isLoading: isLoading || (enabled && !hasLoadedRef.current),
    isRefreshing,
    perPage: pagination.perPage,
    refetch,
    searchValue,
    setCurrentPage,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
