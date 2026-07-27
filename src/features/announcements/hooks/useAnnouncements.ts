import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
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
    return true;
  }

  if (draftStatus === "published") {
    return false;
  }

  return undefined;
}

interface RequestAnnouncementsOptions {
  showSkeleton: boolean;
}

export function useAnnouncements(errorFallback: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pagination, setPagination] =
    useState<AnnouncementPagination>(initialPagination);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [draftFilters, setDraftFilters] =
    useState<AnnouncementFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<AnnouncementFilters>(emptyFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const latestRequestIdRef = useRef(0);
  const requestParamsRef = useRef<GetAnnouncementsParams>({});

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      latestRequestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, []);

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
      isDraft: getDraftFilterValue(appliedFilters.draftStatus),
      page: pagination.currentPage,
      perPage: pagination.perPage,
      receiver: appliedFilters.receiver || undefined,
      title: debouncedSearch || undefined,
    }),
    [
      appliedFilters,
      debouncedSearch,
      pagination.currentPage,
      pagination.perPage,
    ],
  );
  requestParamsRef.current = requestParams;

  const requestAnnouncements = useCallback(
    async (
      params: GetAnnouncementsParams,
      options: RequestAnnouncementsOptions,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      setError("");
      if (options.showSkeleton) {
        setListLoading(true);
      }

      try {
        const result = await getAnnouncements(params, controller.signal);

        if (
          isMountedRef.current &&
          requestId === latestRequestIdRef.current
        ) {
          setAnnouncements(result.announcements);
          setPagination(result.pagination);
        }

        return result;
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return null;
        }

        if (
          isMountedRef.current &&
          requestId === latestRequestIdRef.current
        ) {
          setError(getErrorMessage(requestError, errorFallback));

          if (options.showSkeleton) {
            setAnnouncements([]);
          }
        }

        return null;
      } finally {
        if (
          isMountedRef.current &&
          requestId === latestRequestIdRef.current
        ) {
          setListLoading(false);
        }
      }
    },
    [errorFallback],
  );

  useEffect(() => {
    const requestKey = JSON.stringify(requestParams);

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestAnnouncements(requestParams, { showSkeleton: true });
  }, [requestAnnouncements, requestParams]);

  const refetch = useCallback(
    (showSkeleton = false) =>
      requestAnnouncements(requestParamsRef.current, { showSkeleton }),
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
    perPage: pagination.perPage,
    refetch,
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
  };
}
