import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_VOLUNTEER_APPLICATIONS_PER_PAGE,
  getVolunteerApplicationDetails,
  getVolunteerApplicationStatistics,
  getVolunteerApplications,
  reviewVolunteerApplication,
} from "../api";
import type {
  VolunteerApplicationDetails,
  VolunteerApplicationStatistics,
  VolunteerApplicationStatus,
} from "../types";

type VolunteerSort = "created_at" | "-created_at" | "full_name" | "-full_name" | "status" | "-status";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => globalThis.clearTimeout(timeoutId);
  }, [delayMs, value]);
  return debouncedValue;
}

export function useVolunteerApplications() {
  const [applications, setApplications] = useState([] as Awaited<ReturnType<typeof getVolunteerApplications>>["applications"]);
  const [pagination, setPagination] = useState({ currentPage: 1, perPage: DEFAULT_VOLUNTEER_APPLICATIONS_PER_PAGE, totalItems: 0, totalPages: 1 });
  const [search, setSearchValue] = useState("");
  const [status, setStatusValue] = useState<VolunteerApplicationStatus | "all">("all");
  const [sort, setSortValue] = useState<VolunteerSort>("-created_at");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);
  const debouncedSearch = useDebouncedValue(search, 300);
  const isSearchPending = search !== debouncedSearch;

  const setSearch = useCallback((value: string) => { setSearchValue(value); setPagination((current) => ({ ...current, currentPage: 1 })); }, []);
  const setStatus = useCallback((value: VolunteerApplicationStatus | "all") => { setStatusValue(value); setPagination((current) => ({ ...current, currentPage: 1 })); }, []);
  const setSort = useCallback((value: VolunteerSort) => { setSortValue(value); setPagination((current) => ({ ...current, currentPage: 1 })); }, []);
  const setPage = useCallback((currentPage: number) => setPagination((current) => ({ ...current, currentPage: Math.min(Math.max(1, currentPage), current.totalPages) })), []);
  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  useEffect(() => {
    if (isSearchPending) {
      return;
    }
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const isInitialLoad = !hasLoadedRef.current;
    setIsLoading(isInitialLoad);
    setIsRefreshing(!isInitialLoad);
    setError(null);

    getVolunteerApplications({ page: pagination.currentPage, perPage: pagination.perPage, search: debouncedSearch, status: status === "all" ? undefined : status, sort }, controller.signal)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        hasLoadedRef.current = true;
        setApplications(result.applications);
        setPagination(result.pagination);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setError(requestError instanceof Error ? requestError.message : "");
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [debouncedSearch, isSearchPending, pagination.currentPage, pagination.perPage, refreshToken, sort, status]);

  return { applications, error, isLoading, isRefreshing, pagination, refresh, search, setPage, setSearch, setSort, setStatus, sort, status };
}

export function useVolunteerApplicationStatistics() {
  const [statistics, setStatistics] = useState<VolunteerApplicationStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true); setError(null);
    getVolunteerApplicationStatistics(controller.signal)
      .then(setStatistics)
      .catch((requestError: unknown) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : ""); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [refreshToken]);
  return { error, isLoading, refresh, statistics };
}

export function useVolunteerApplicationDetails(applicationId: number | null) {
  const [application, setApplication] = useState<VolunteerApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);
  useEffect(() => {
    if (applicationId === null) { setApplication(null); setError(null); return; }
    const controller = new AbortController();
    setIsLoading(true); setError(null);
    getVolunteerApplicationDetails(applicationId, controller.signal)
      .then(setApplication)
      .catch((requestError: unknown) => { if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : ""); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [applicationId, refreshToken]);
  return { application, error, isLoading, refresh };
}

export function useVolunteerApplicationActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const review = useCallback(async (applicationId: number, decision: "approve" | "reject", reviewNote: string) => {
    if (isSubmittingRef.current) return false;

    isSubmittingRef.current = true;
    setIsSubmitting(true); setError(null);
    try { await reviewVolunteerApplication(applicationId, decision, reviewNote); return true; }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : ""); return false; }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  }, []);
  const clearError = useCallback(() => setError(null), []);
  return { clearError, error, isSubmitting, review };
}
