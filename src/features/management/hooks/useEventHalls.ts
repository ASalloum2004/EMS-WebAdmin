import { useCallback, useEffect, useRef, useState } from "react";
import { getEventHalls } from "../api";
import type { EventHall } from "../types";

type UseEventHallsOptions = {
  enabled?: boolean;
  errorFallback?: string;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function useEventHalls({
  enabled = true,
  errorFallback = "",
}: UseEventHallsOptions = {}) {
  const [eventHalls, setEventHalls] = useState<EventHall[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasRequestedEventHalls = useRef(false);

  const refetch = useCallback(async () => {
    setError("");
    setIsLoading(true);

    try {
      const nextEventHalls = await getEventHalls();
      setEventHalls(nextEventHalls);
      return nextEventHalls;
    } catch (eventHallsError) {
      setError(getErrorMessage(eventHallsError, errorFallback));
      setEventHalls([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [errorFallback]);

  useEffect(() => {
    if (!enabled || hasRequestedEventHalls.current) {
      return;
    }

    hasRequestedEventHalls.current = true;
    void refetch();
  }, [enabled, refetch]);

  return {
    eventHalls,
    isLoading,
    error,
    refetch,
  };
}
