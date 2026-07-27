import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getHalls } from "../api";
import type { HallApiData } from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useHalls(enabled = true) {
  const [halls, setHalls] = useState<HallApiData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasRequestedHalls = useRef(false);
  const hasLoadedHalls = useRef(false);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!enabled) {
      return [];
    }

    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;
    setError("");
    setIsLoading(!hasLoadedHalls.current);
    setIsRefreshing(hasLoadedHalls.current);

    try {
      const nextHalls = await getHalls(controller.signal);

      if (requestId === requestIdRef.current) {
        hasLoadedHalls.current = true;
        setHalls(nextHalls);
      }

      return nextHalls;
    } catch (hallsError) {
      if (isAbortError(hallsError)) {
        return [];
      }

      if (requestId === requestIdRef.current) {
        setError(getErrorMessage(hallsError, "Unable to load halls."));

        if (!hasLoadedHalls.current) {
          setHalls([]);
        }
      }

      return [];
    } finally {
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      hasRequestedHalls.current = false;
      hasLoadedHalls.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (disposedBeforeStart || hasRequestedHalls.current) {
        return;
      }

      hasRequestedHalls.current = true;
      void refetch();
    });

    return () => {
      disposedBeforeStart = true;
      requestIdRef.current += 1;
      hasRequestedHalls.current = false;
      hasLoadedHalls.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [enabled, refetch]);

  return {
    halls,
    isLoading: isLoading || (enabled && !hasRequestedHalls.current),
    isRefreshing,
    error,
    refetch,
  };
}
