import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../../api";
import { getBoothRequestDetails } from "../api";
import type { BoothRequestDetailsApiData } from "../types";

type BoothRequestDetailsState = {
  boothRequestId: number | null;
  details: BoothRequestDetailsApiData | null;
  error: string;
  isLoading: boolean;
};

const initialDetailsState: BoothRequestDetailsState = {
  boothRequestId: null,
  details: null,
  error: "",
  isLoading: false,
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function isLatestBoothRequestDetailsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useBoothRequestDetails(boothRequestId: number | null) {
  const [state, setState] =
    useState<BoothRequestDetailsState>(initialDetailsState);
  const isMountedRef = useRef(true);
  const lastAutomaticallyRequestedIdRef = useRef<number | null>(null);
  const latestRequestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);
  const selectedRequestIdRef = useRef(boothRequestId);
  selectedRequestIdRef.current = boothRequestId;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, []);

  const loadDetails = useCallback(async (requestedId: number) => {
    activeRequestRef.current?.abort();

    const controller = new AbortController();
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;
    activeRequestRef.current = controller;

    setState({
      boothRequestId: requestedId,
      details: null,
      error: "",
      isLoading: true,
    });

    try {
      const details = await getBoothRequestDetails(
        requestedId,
        controller.signal,
      );

      if (
        isMountedRef.current &&
        selectedRequestIdRef.current === requestedId &&
        isLatestBoothRequestDetailsRequest(
          requestId,
          latestRequestIdRef.current,
        )
      ) {
        setState({
          boothRequestId: requestedId,
          details,
          error: "",
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
        isLatestBoothRequestDetailsRequest(
          requestId,
          latestRequestIdRef.current,
        )
      ) {
        setState({
          boothRequestId: requestedId,
          details: null,
          error: getErrorMessage(
            requestError,
            "Unable to load booth request details.",
          ),
          isLoading: false,
        });
      }

      return null;
    } finally {
      if (requestId === latestRequestIdRef.current) {
        activeRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (boothRequestId === null) {
      lastAutomaticallyRequestedIdRef.current = null;
      latestRequestIdRef.current += 1;
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      setState((currentState) =>
        currentState.boothRequestId === null &&
        currentState.details === null &&
        !currentState.error &&
        !currentState.isLoading
          ? currentState
          : initialDetailsState,
      );
      return;
    }

    if (lastAutomaticallyRequestedIdRef.current === boothRequestId) {
      return;
    }

    lastAutomaticallyRequestedIdRef.current = boothRequestId;
    void loadDetails(boothRequestId);
  }, [boothRequestId, loadDetails]);

  const refetch = useCallback(() => {
    if (boothRequestId === null) {
      return Promise.resolve(null);
    }

    lastAutomaticallyRequestedIdRef.current = boothRequestId;
    return loadDetails(boothRequestId);
  }, [boothRequestId, loadDetails]);

  const hasCurrentState =
    boothRequestId !== null && state.boothRequestId === boothRequestId;

  return {
    details: hasCurrentState ? state.details : null,
    error: hasCurrentState ? state.error : "",
    isLoading:
      boothRequestId !== null &&
      (!hasCurrentState || state.isLoading),
    refetch,
  };
}
