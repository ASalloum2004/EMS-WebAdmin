import { useCallback, useEffect, useRef, useState } from "react";
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

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((currentState) => ({
      ...currentState,
      error: "",
      isLoading: true,
    }));

    try {
      const directory = await getManagerDirectory();

      if (requestId === requestIdRef.current) {
        setState({
          directory,
          error: "",
          isLoading: false,
        });
      }

      return directory;
    } catch (requestError) {
      if (requestId === requestIdRef.current) {
        setState({
          directory: null,
          error: getErrorMessage(requestError, errorFallback),
          isLoading: false,
        });
      }

      return null;
    }
  }, [errorFallback]);

  useEffect(() => {
    if (!enabled || hasRequestedRef.current) {
      return;
    }

    hasRequestedRef.current = true;
    void refetch();
  }, [enabled, refetch]);

  return {
    ...state,
    isLoading: state.isLoading || (enabled && !hasRequestedRef.current),
    refetch,
  };
}
