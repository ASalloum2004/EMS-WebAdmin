import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import {
  DEFAULT_EVENT_REQUESTS_PER_PAGE,
  getEventRequests,
} from "../api";
import type {
  EventRequestsPagination,
  GetEventRequestsParams,
  GetEventRequestsResult,
} from "../types";
import {
  getEventRequestFilterParams,
  useEventRequestFilters,
} from "./useEventRequestFilters";

export const EVENT_REQUEST_SEARCH_DEBOUNCE_MS = 400;

type UseEventRequestsOptions = {
  enabled?: boolean;
  errorFallback: string;
};

const initialPagination: EventRequestsPagination = {
  currentPage: 1,
  perPage: DEFAULT_EVENT_REQUESTS_PER_PAGE,
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

function getRequestKey(params: GetEventRequestsParams) {
  return JSON.stringify(params);
}

interface ActiveEventRequestsRequest {
  controller: AbortController;
  key: string;
}

export function isLatestEventRequestsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useEventRequests({
  enabled = true,
  errorFallback,
}: UseEventRequestsOptions) {
  const [requests, setRequests] = useState<GetEventRequestsResult["requests"]>(
    [],
  );
  const [pagination, setPagination] =
    useState<EventRequestsPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveEventRequestsRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const requestParamsRef = useRef<GetEventRequestsParams>({});
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
  }, []);
  const filters = useEventRequestFilters({
    onFiltersChange: resetPagination,
  });
  const filterParams = getEventRequestFilterParams(filters.appliedFilters);
  const createdDate = filterParams.createdDate;
  const sort = filterParams.sort;
  const status = filterParams.status;

  useEffect(() => {
    const nextTitle = searchValue.trim();

    if (nextTitle === debouncedTitle) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedTitle(nextTitle);
      resetPagination();
    }, EVENT_REQUEST_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedTitle, resetPagination, searchValue]);

  const requestParams = useMemo<GetEventRequestsParams>(
    () => ({
      createdDate,
      page: currentPage,
      perPage,
      sort,
      status,
      title: debouncedTitle || undefined,
    }),
    [createdDate, currentPage, debouncedTitle, perPage, sort, status],
  );
  requestParamsRef.current = requestParams;

  const requestEventRequests = useCallback(
    async (params: GetEventRequestsParams) => {
      if (!enabled) {
        return {
          requests: [],
          pagination: initialPagination,
        } satisfies GetEventRequestsResult;
      }

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
        const result = await getEventRequests(params, controller.signal);

        if (isLatestEventRequestsRequest(requestId, requestIdRef.current)) {
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
            perPage: params.perPage ?? DEFAULT_EVENT_REQUESTS_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
        } satisfies GetEventRequestsResult;

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (isLatestEventRequestsRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(requestError, errorFallback));

          if (!hasLoadedRef.current) {
            setRequests([]);
          }
        }

        return preservedResult;
      } finally {
        if (isLatestEventRequestsRequest(requestId, requestIdRef.current)) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [enabled, errorFallback],
  );

  const refetch = useCallback(
    () => requestEventRequests(requestParamsRef.current),
    [requestEventRequests],
  );

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      hasLoadedRef.current = false;
      activeRequestRef.current?.controller.abort();
      activeRequestRef.current = null;
      automaticRequestKeyRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

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
      void requestEventRequests(requestParams);
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
  }, [enabled, requestEventRequests, requestParams]);

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
      (enabled && !hasLoadedRef.current && automaticRequestKeyRef.current === null),
    isRefreshing,
    perPage: pagination.perPage,
    refetch,
    requests,
    searchValue,
    setCurrentPage,
    setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
