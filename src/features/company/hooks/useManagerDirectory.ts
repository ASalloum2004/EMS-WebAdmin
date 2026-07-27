import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getManagerDirectory } from "../api";
import type { ManagerDirectory } from "../types";

type ManagerDirectoryState = {
  directory: ManagerDirectory | null;
  error: string;
  isLoading: boolean;
};

const initialState: ManagerDirectoryState = {
  directory: null,
  error: "",
  isLoading: false,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useManagerDirectory(
  errorFallback: string,
  enabled: boolean,
) {
  const [state, setState] = useState<ManagerDirectoryState>(initialState);
  const hasRequestedRef = useRef(false);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    activeRequestRef.current = controller;
    setState((currentState) => ({
      ...currentState,
      error: "",
      isLoading: true,
    }));

    try {
      const directory = await getManagerDirectory(controller.signal);

      if (requestId === requestIdRef.current) {
        setState({
          directory,
          error: "",
          isLoading: false,
        });
      }

      return directory;
    } catch (requestError) {
      if (isAbortError(requestError)) {
        return null;
      }

      if (requestId === requestIdRef.current) {
        setState({
          directory: null,
          error: getErrorMessage(requestError, errorFallback),
          isLoading: false,
        });
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null;
        setState((currentState) => ({
          ...currentState,
          isLoading: false,
        }));
      }
    }
  }, [errorFallback]);

  useEffect(() => {
    if (!enabled) {
      requestIdRef.current += 1;
      hasRequestedRef.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setState((currentState) => ({
        ...currentState,
        isLoading: false,
      }));
      return;
    }

    let disposedBeforeStart = false;

    queueMicrotask(() => {
      if (disposedBeforeStart || hasRequestedRef.current) {
        return;
      }

      hasRequestedRef.current = true;
      void refetch();
    });

    return () => {
      disposedBeforeStart = true;
      requestIdRef.current += 1;
      hasRequestedRef.current = false;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [enabled, refetch]);

  return {
    ...state,
    isLoading: state.isLoading || (enabled && !hasRequestedRef.current),
    refetch,
  };
}
