import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function isLatestCompaniesRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useCompanies(errorFallback: string) {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [pagination, setPagination] =
    useState<CompanyPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const requestIdRef = useRef(0);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const requestParamsRef = useRef<GetCompaniesParams>({});
  const currentPage = pagination.currentPage;

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
      status,
    }),
    [businessSector, currentPage, debouncedSearch, status],
  );
  requestParamsRef.current = requestParams;

  const requestCompanies = useCallback(
    async (params: GetCompaniesParams) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const result = await getCompanies(params);

        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
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

        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));
          setCompanies([]);
        }

        return preservedResult;
      } finally {
        if (isLatestCompaniesRequest(requestId, requestIdRef.current)) {
          setIsLoading(false);
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
    const requestKey = getRequestKey(requestParams);

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestCompanies(requestParams);
  }, [requestCompanies, requestParams]);

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
    isLoading,
    perPage: pagination.perPage,
    refetch,
    searchValue,
    setCurrentPage,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
