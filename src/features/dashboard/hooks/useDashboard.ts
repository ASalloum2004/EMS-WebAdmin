import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getDashboard } from "../api";
import type { DashboardData } from "../types";

export type DashboardState = {
  dashboard: DashboardData | null;
  error: string;
  isLoading: boolean;
  isRefreshing: boolean;
};

const initialDashboardState: DashboardState = {
  dashboard: null,
  error: "",
  isLoading: true,
  isRefreshing: false,
};

export function getDashboardSuccessState(
  dashboard: DashboardData,
): DashboardState {
  return {
    dashboard,
    error: "",
    isLoading: false,
    isRefreshing: false,
  };
}

export function getDashboardFailureState(error: string): DashboardState {
  return {
    dashboard: null,
    error,
    isLoading: false,
    isRefreshing: false,
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard.";
}

function isLatestDashboardRequest(requestId: number, latestRequestId: number) {
  return requestId === latestRequestId;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(initialDashboardState);
  const hasRequestedDashboard = useRef(false);
  const hasLoadedDashboard = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;
    setState((currentState) => ({
      ...currentState,
      error: "",
      isLoading: !hasLoadedDashboard.current,
      isRefreshing: hasLoadedDashboard.current,
    }));

    try {
      const dashboard = await getDashboard(controller.signal);

      if (isLatestDashboardRequest(requestId, requestIdRef.current)) {
        hasLoadedDashboard.current = true;
        setState(getDashboardSuccessState(dashboard));
      }

      return dashboard;
    } catch (dashboardError) {
      if (isAbortError(dashboardError)) {
        return null;
      }

      if (isLatestDashboardRequest(requestId, requestIdRef.current)) {
        setState((currentState) => ({
          dashboard: hasLoadedDashboard.current
            ? currentState.dashboard
            : null,
          error: getErrorMessage(dashboardError),
          isLoading: false,
          isRefreshing: false,
        }));
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null;
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
          isRefreshing: false,
        }));
      }
    }
  }, []);

  useEffect(() => {
    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (disposedBeforeStart || hasRequestedDashboard.current) {
        return;
      }

      hasRequestedDashboard.current = true;
      void refetch();
    });

    return () => {
      disposedBeforeStart = true;
      requestIdRef.current += 1;
      hasRequestedDashboard.current = false;
      hasLoadedDashboard.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [refetch]);

  return {
    ...state,
    isInitialLoading: state.isLoading,
    isLoading: state.isLoading || state.isRefreshing,
    refetch,
  };
}
