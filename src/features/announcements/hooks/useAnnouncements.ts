import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AnnouncementListTimeoutError,
  DEFAULT_ANNOUNCEMENTS_PER_PAGE,
  getAnnouncements,
} from "../api";
import type {
  Announcement,
  AnnouncementFilters,
  AnnouncementPagination,
  GetAnnouncementsParams,
} from "../types";

export const ANNOUNCEMENT_SEARCH_DEBOUNCE_MS = 400;

const emptyFilters: AnnouncementFilters = {
  draftStatus: "",
  receiver: "",
};

const initialPagination: AnnouncementPagination = {
  currentPage: 1,
  perPage: DEFAULT_ANNOUNCEMENTS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AnnouncementListTimeoutError) {
    return fallbackMessage;
  }

  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getDraftFilterValue(
  draftStatus: AnnouncementFilters["draftStatus"],
) {
  if (draftStatus === "draft") {
    return false;
  }

  if (draftStatus === "published") {
    return true;
  }

  return undefined;
}

function getRequestKey(params: GetAnnouncementsParams) {
  return JSON.stringify(params);
}

interface ActiveAnnouncementsRequest {
  controller: AbortController;
  key: string;
}

interface RequestAnnouncementsOptions {
  loadingMode: "background" | "foreground";
}

export function useAnnouncements(errorFallback: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] =
    useState<AnnouncementPagination>(initialPagination);
  const [listLoading, setListLoading] = useState(true);
  const [listRefetching, setListRefetching] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftFilters, setDraftFilters] =
    useState<AnnouncementFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AnnouncementFilters>(emptyFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const activeRequestRef = useRef<ActiveAnnouncementsRequest | null>(null);
  const latestRequestIdRef = useRef(0);
  const requestParamsRef = useRef<GetAnnouncementsParams>({});

  useEffect(() => {
    const nextSearch = searchQuery.trim();

    if (nextSearch === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(nextSearch);
      setPagination((currentPagination) => ({
        ...currentPagination,
        currentPage: 1,
      }));
    }, ANNOUNCEMENT_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, searchQuery]);

  const requestParams = useMemo<GetAnnouncementsParams>(
    () => ({
      isActive: getDraftFilterValue(appliedFilters.draftStatus),
      page: pagination.currentPage,
      perPage: pagination.perPage,
      receiver: appliedFilters.receiver || undefined,
      title: debouncedSearch || undefined,
    }),
    [
      appliedFilters.draftStatus,
      appliedFilters.receiver,
      debouncedSearch,
      pagination.currentPage,
      pagination.perPage,
    ],
  );
  const requestKey = getRequestKey(requestParams);
  requestParamsRef.current = requestParams;

  const requestAnnouncements = useCallback(
    async (
      params: GetAnnouncementsParams,
      options: RequestAnnouncementsOptions,
    ) => {
      activeRequestRef.current?.controller.abort();

      const controller = new AbortController();
      const requestId = latestRequestIdRef.current + 1;
      const key = getRequestKey(params);
      latestRequestIdRef.current = requestId;
      activeRequestRef.current = { controller, key };

      setError("");
      if (options.loadingMode === "foreground") {
        setListLoading(true);
        setListRefetching(false);
      } else {
        setListLoading(false);
        setListRefetching(true);
      }

      try {
        const result = await getAnnouncements(params, controller.signal);

        if (requestId === latestRequestIdRef.current) {
          setAnnouncements(result.announcements);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return null;
        }

        if (requestId === latestRequestIdRef.current) {
          setError(getErrorMessage(requestError, errorFallback));

          if (options.loadingMode === "foreground") {
            setAnnouncements([]);
          }
        }

        return null;
      } finally {
        if (requestId === latestRequestIdRef.current) {
          activeRequestRef.current = null;
          setListLoading(false);
          setListRefetching(false);
        }
      }
    },
    [errorFallback],
  );

  useEffect(() => {
    let disposedBeforeStart = false;
    const params = requestParamsRef.current;

    queueMicrotask(() => {
      if (!disposedBeforeStart) {
        void requestAnnouncements(params, { loadingMode: "foreground" });
      }
    });

    return () => {
      disposedBeforeStart = true;
      const activeRequest = activeRequestRef.current;

      if (activeRequest?.key === requestKey) {
        latestRequestIdRef.current += 1;
        activeRequestRef.current = null;
        activeRequest.controller.abort();
      }
    };
  }, [requestAnnouncements, requestKey]);

  const refetch = useCallback(
    (showSkeleton = false) =>
      requestAnnouncements(requestParamsRef.current, {
        loadingMode: showSkeleton ? "foreground" : "background",
      }),
    [requestAnnouncements],
  );

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

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
    setIsFilterPanelOpen(false);
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
    }));
    setIsFilterPanelOpen(false);
  }, []);

  const hasActiveFilters = Boolean(
    appliedFilters.receiver || appliedFilters.draftStatus,
  );

  return {
    announcements,
    currentPage: pagination.currentPage,
    error,
    filters: {
      appliedFilters,
      applyFilters,
      clearFilters,
      draftFilters,
      hasActiveFilters,
      isFilterPanelOpen,
      setDraftFilters,
      toggleFilterPanel: () =>
        setIsFilterPanelOpen((isOpen) => !isOpen),
    },
    hasActiveCriteria: Boolean(debouncedSearch || hasActiveFilters),
    listLoading,
    listRefetching,
    perPage: pagination.perPage,
    refetch,
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
