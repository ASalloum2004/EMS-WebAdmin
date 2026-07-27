import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getEventRequestDetails } from "../api";
import type { EventRequestDetails } from "../types";

type EventRequestDetailsState = {
  details: EventRequestDetails | null;
  error: string;
  eventRequestId: number | null;
  isLoading: boolean;
};

const initialDetailsState: EventRequestDetailsState = {
  details: null,
  error: "",
  eventRequestId: null,
  isLoading: false,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

export function isLatestEventRequestDetailsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useEventRequestDetails(
  eventRequestId: number | null,
  errorFallback: string,
) {
  const [state, setState] =
    useState<EventRequestDetailsState>(initialDetailsState);
  const isMountedRef = useRef(true);
  const lastAutomaticallyRequestedIdRef = useRef<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const selectedRequestIdRef = useRef(eventRequestId);
  selectedRequestIdRef.current = eventRequestId;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, []);

  const loadDetails = useCallback(
    async (requestedId: number) => {
      activeRequestRef.current?.abort();

      const controller = new AbortController();
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      activeRequestRef.current = controller;

      setState({
        details: null,
        error: "",
        eventRequestId: requestedId,
        isLoading: true,
      });

      try {
        const details = await getEventRequestDetails(
          requestedId,
          controller.signal,
        );

        if (
          isMountedRef.current &&
          selectedRequestIdRef.current === requestedId &&
          isLatestEventRequestDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setState({
            details,
            error: "",
            eventRequestId: requestedId,
            isLoading: false,
          });
        }

        return details;
      } catch (requestError) {
        if (isAbortError(requestError)) {
          return null;
        }

        if (
          isMountedRef.current &&
          selectedRequestIdRef.current === requestedId &&
          isLatestEventRequestDetailsRequest(
            requestId,
            latestRequestIdRef.current,
          )
        ) {
          setState({
            details: null,
            error: getErrorMessage(requestError, errorFallback),
            eventRequestId: requestedId,
            isLoading: false,
          });
        }

        return null;
      } finally {
        if (requestId === latestRequestIdRef.current) {
          activeRequestRef.current = null;
        }
      }
    },
    [errorFallback],
  );

  useEffect(() => {
    if (eventRequestId === null) {
      lastAutomaticallyRequestedIdRef.current = null;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setState((currentState) =>
        currentState.eventRequestId === null &&
        currentState.details === null &&
        !currentState.error &&
        !currentState.isLoading
          ? currentState
          : initialDetailsState,
      );
      return;
    }

    if (lastAutomaticallyRequestedIdRef.current === eventRequestId) {
      return;
    }

    lastAutomaticallyRequestedIdRef.current = eventRequestId;
    void loadDetails(eventRequestId);
  }, [eventRequestId, loadDetails]);

  const refetch = useCallback(() => {
    if (eventRequestId === null) {
      return Promise.resolve(null);
    }

    lastAutomaticallyRequestedIdRef.current = eventRequestId;
    return loadDetails(eventRequestId);
  }, [eventRequestId, loadDetails]);

  const hasCurrentState =
    eventRequestId !== null && state.eventRequestId === eventRequestId;

  return {
    details: hasCurrentState ? state.details : null,
    error: hasCurrentState ? state.error : "",
    isLoading:
      eventRequestId !== null && (!hasCurrentState || state.isLoading),
    refetch,
  };
}


