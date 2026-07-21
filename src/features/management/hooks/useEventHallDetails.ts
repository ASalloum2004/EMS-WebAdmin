import { useCallback, useEffect, useRef, useState } from "react";
import { getEventHallDetails } from "../api";
import type { EventHallDetails } from "../types";

type UseEventHallDetailsOptions = {
  errorFallback: string;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function isLatestEventHallDetailsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useEventHallDetails({
  errorFallback,
}: UseEventHallDetailsOptions) {
  const [selectedEventHallId, setSelectedEventHallId] = useState<
    number | null
  >(null);
  const [eventHallDetails, setEventHallDetails] =
    useState<EventHallDetails | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isMountedRef = useRef(true);
  const isOpenRef = useRef(false);
  const loadingEventHallIdRef = useRef<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const selectedEventHallIdRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDetails = useCallback(
    async (eventHallId: number) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      loadingEventHallIdRef.current = eventHallId;
      setEventHallDetails(null);
      setError("");
      setIsLoading(true);

      try {
        const details = await getEventHallDetails(eventHallId);

        if (
          isMountedRef.current &&
          isOpenRef.current &&
          selectedEventHallIdRef.current === eventHallId &&
          isLatestEventHallDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setEventHallDetails(details);
        }

        return details;
      } catch (detailsError) {
        if (
          isMountedRef.current &&
          isOpenRef.current &&
          selectedEventHallIdRef.current === eventHallId &&
          isLatestEventHallDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setError(getErrorMessage(detailsError, errorFallback));
        }

        return null;
      } finally {
        if (
          isMountedRef.current &&
          isOpenRef.current &&
          selectedEventHallIdRef.current === eventHallId &&
          isLatestEventHallDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          loadingEventHallIdRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [errorFallback],
  );

  const openDetails = useCallback(
    (eventHallId: number) => {
      const isDuplicateOpen =
        isOpenRef.current &&
        selectedEventHallIdRef.current === eventHallId &&
        loadingEventHallIdRef.current === eventHallId;

      if (isDuplicateOpen) {
        return;
      }

      selectedEventHallIdRef.current = eventHallId;
      isOpenRef.current = true;
      setSelectedEventHallId(eventHallId);
      setIsOpen(true);
      setEventHallDetails(null);
      setError("");
      void loadDetails(eventHallId);
    },
    [loadDetails],
  );

  const closeDetails = useCallback(() => {
    latestRequestIdRef.current += 1;
    loadingEventHallIdRef.current = null;
    selectedEventHallIdRef.current = null;
    isOpenRef.current = false;
    setSelectedEventHallId(null);
    setEventHallDetails(null);
    setError("");
    setIsLoading(false);
    setIsOpen(false);
  }, []);

  const retry = useCallback(() => {
    const eventHallId = selectedEventHallIdRef.current;

    if (!isOpenRef.current || eventHallId === null) {
      return Promise.resolve(null);
    }

    return loadDetails(eventHallId);
  }, [loadDetails]);

  return {
    closeDetails,
    error,
    eventHallDetails,
    isLoading,
    isOpen,
    openDetails,
    retry,
    selectedEventHallId,
  };
}
