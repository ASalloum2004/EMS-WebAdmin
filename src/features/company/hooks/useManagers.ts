import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_MANAGERS_PER_PAGE, getManagers } from "../api";
import type {
  GetManagersParams,
  GetManagersResult,
  ManagerListItem,
  ManagerPagination,
  ManagerSearchField,
} from "../types";

export const MANAGER_SEARCH_DEBOUNCE_MS = 400;

const initialPagination: ManagerPagination = {
  currentPage: 1,
  perPage: DEFAULT_MANAGERS_PER_PAGE,
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

function getRequestKey(params: GetManagersParams) {
  return JSON.stringify(params);
}

export function isLatestManagersRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useManagers(errorFallback: string) {
  const [managers, setManagers] = useState<ManagerListItem[]>([]);
  const [pagination, setPagination] =
    useState<ManagerPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchField, setSearchFieldState] =
    useState<ManagerSearchField>("name");
  const requestIdRef = useRef(0);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const requestParamsRef = useRef<GetManagersParams>({});
  const currentPage = pagination.currentPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);

  useEffect(() => {
    const nextSearch = searchValue.trim();

    if (nextSearch === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
      resetPagination();
    }, MANAGER_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, resetPagination, searchValue]);

  const requestParams = useMemo<GetManagersParams>(
    () => ({
      page: currentPage,
      search: debouncedSearch || undefined,
      searchField: debouncedSearch ? searchField : undefined,
    }),
    [currentPage, debouncedSearch, searchField],
  );
  requestParamsRef.current = requestParams;

  const requestManagers = useCallback(
    async (params: GetManagersParams) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const result = await getManagers(params);

        if (isLatestManagersRequest(requestId, requestIdRef.current)) {
          setManagers(result.managers);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          managers: [],
          pagination: {
            currentPage: params.page ?? 1,
            perPage: DEFAULT_MANAGERS_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
        } satisfies GetManagersResult;

        if (isLatestManagersRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));
          setManagers([]);
        }

        return preservedResult;
      } finally {
        if (isLatestManagersRequest(requestId, requestIdRef.current)) {
          setIsLoading(false);
        }
      }
    },
    [errorFallback],
  );

  const refetch = useCallback(
    () => requestManagers(requestParamsRef.current),
    [requestManagers],
  );

  useEffect(() => {
    const requestKey = getRequestKey(requestParams);

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestManagers(requestParams);
  }, [requestManagers, requestParams]);

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

  const setSearchField = useCallback(
    (field: ManagerSearchField) => {
      setSearchFieldState(field);
      resetPagination();
    },
    [resetPagination],
  );

  return {
    currentPage: pagination.currentPage,
    error,
    hasActiveSearch: Boolean(debouncedSearch),
    isLoading,
    managers,
    perPage: pagination.perPage,
    refetch,
    searchField,
    searchValue,
    setCurrentPage,
    setSearchField,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
