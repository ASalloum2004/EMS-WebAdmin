import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import {
  DEFAULT_NOTIFICATIONS_PER_PAGE,
  getAllNotifications,
  getUnreadNotifications,
} from "../api";
import type {
  GetNotificationsParams,
  GetNotificationsResult,
  NotificationsPagination,
  NotificationView,
} from "../types";

const DEFAULT_NOTIFICATION_SORT = "-created_at";

const initialPagination: NotificationsPagination = {
  currentPage: 1,
  perPage: DEFAULT_NOTIFICATIONS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

interface UseNotificationsOptions {
  enabled: boolean;
  errorFallback: string;
  type?: string;
  view: NotificationView;
}

interface ActiveNotificationsRequest {
  controller: AbortController;
  key: string;
}

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

function getRequestKey(params: GetNotificationsParams) {
  return JSON.stringify(params);
}

function getNotificationsRequest(
  view: NotificationView,
  params: GetNotificationsParams,
  signal: AbortSignal,
) {
  return view === "all"
    ? getAllNotifications(params, signal)
    : getUnreadNotifications(params, signal);
}

export function useNotifications({
  enabled,
  errorFallback,
  type,
  view,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<
    GetNotificationsResult["notifications"]
  >([]);
  const [pagination, setPagination] =
    useState<NotificationsPagination>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<ActiveNotificationsRequest | null>(null);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const requestParamsRef = useRef<GetNotificationsParams>({});
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;
  const requestParams = useMemo<GetNotificationsParams>(
    () => ({
      page: currentPage,
      perPage,
      sort: DEFAULT_NOTIFICATION_SORT,
      type: type?.trim() || undefined,
    }),
    [currentPage, perPage, type],
  );
  const requestKey = getRequestKey(requestParams);

  requestParamsRef.current = requestParams;

  const requestNotifications = useCallback(
    async (params: GetNotificationsParams) => {
      activeRequestRef.current?.controller.abort();

      const controller = new AbortController();
      const requestId = requestIdRef.current + 1;
      const nextRequestKey = getRequestKey(params);
      requestIdRef.current = requestId;
      activeRequestRef.current = { controller, key: nextRequestKey };

      setError("");
      setIsLoading(!hasLoadedRef.current);
      setIsRefreshing(hasLoadedRef.current);

      try {
        const result = await getNotificationsRequest(
          view,
          params,
          controller.signal,
        );

        if (requestId === requestIdRef.current) {
          hasLoadedRef.current = true;
          setNotifications(result.notifications);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        const preservedResult = {
          notifications: [],
          pagination: {
            currentPage: params.page ?? 1,
            perPage: params.perPage ?? DEFAULT_NOTIFICATIONS_PER_PAGE,
            totalItems: 0,
            totalPages: 1,
          },
        } satisfies GetNotificationsResult;

        if (isAbortError(requestError)) {
          return preservedResult;
        }

        if (requestId === requestIdRef.current) {
          setError(getErrorMessage(requestError, errorFallback));

          if (!hasLoadedRef.current) {
            setNotifications([]);
          }
        }

        return preservedResult;
      } finally {
        if (requestId === requestIdRef.current) {
          activeRequestRef.current = null;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [errorFallback, view],
  );

  const refetch = useCallback(
    () => requestNotifications(requestParamsRef.current),
    [requestNotifications],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (
        disposedBeforeStart ||
        automaticRequestKeyRef.current === requestKey
      ) {
        return;
      }

      automaticRequestKeyRef.current = requestKey;
      void requestNotifications(requestParams);
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
  }, [enabled, requestKey, requestNotifications, requestParams]);

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
    isLoading:
      isLoading ||
      (enabled &&
        !hasLoadedRef.current &&
        automaticRequestKeyRef.current === null),
    isRefreshing,
    notifications,
    perPage: pagination.perPage,
    refetch,
    setCurrentPage,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
