import { useCallback, useEffect, useRef, useState } from "react";
import { getAnnouncement } from "../api";
import type { Announcement } from "../types";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useAnnouncementDetails(
  announcementId: number | null,
  errorFallback: string,
) {
  const [announcement, setAnnouncement] =
    useState<Announcement | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const latestRequestIdRef = useRef(0);
  const selectedIdRef = useRef(announcementId);
  selectedIdRef.current = announcementId;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const loadDetails = useCallback(
    async (requestedId: number) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      setAnnouncement(null);
      setError("");
      setDetailsLoading(true);

      try {
        const details = await getAnnouncement(requestedId, controller.signal);

        if (
          isMountedRef.current &&
          selectedIdRef.current === requestedId &&
          requestId === latestRequestIdRef.current
        ) {
          setAnnouncement(details);
        }

        return details;
      } catch (requestError) {
        if (!isAbortError(requestError)) {
          if (
            isMountedRef.current &&
            selectedIdRef.current === requestedId &&
            requestId === latestRequestIdRef.current
          ) {
            setError(getErrorMessage(requestError, errorFallback));
          }
        }

        return null;
      } finally {
        if (
          isMountedRef.current &&
          selectedIdRef.current === requestedId &&
          requestId === latestRequestIdRef.current
        ) {
          setDetailsLoading(false);
        }
      }
    },
    [errorFallback],
  );

  useEffect(() => {
    if (announcementId === null) {
      latestRequestIdRef.current += 1;
      controllerRef.current?.abort();
      setAnnouncement(null);
      setError("");
      setDetailsLoading(false);
      return;
    }

    void loadDetails(announcementId);
  }, [announcementId, loadDetails]);

  const retry = useCallback(() => {
    if (announcementId === null) {
      return Promise.resolve(null);
    }

    return loadDetails(announcementId);
  }, [announcementId, loadDetails]);

  return {
    announcement,
    detailsLoading,
    error,
    retry,
  };
}
