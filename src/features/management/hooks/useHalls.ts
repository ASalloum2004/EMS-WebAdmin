import { useCallback, useEffect, useRef, useState } from "react";
import { getHalls } from "../api";
import type { HallApiData } from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useHalls() {
  const [halls, setHalls] = useState<HallApiData[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasRequestedHalls = useRef(false);

  const refetch = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const nextHalls = await getHalls();
      setHalls(nextHalls);
      return nextHalls;
    } catch (hallsError) {
      setError(getErrorMessage(hallsError, "Unable to load halls."));
      setHalls([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasRequestedHalls.current) {
      return;
    }

    hasRequestedHalls.current = true;
    void refetch();
  }, [refetch]);

  return {
    halls,
    isLoading,
    error,
    refetch,
  };
}
