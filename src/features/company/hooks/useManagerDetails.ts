import { useCallback, useEffect, useRef, useState } from "react";
import { getManagerDetails } from "../api";
import type { ManagerDetailsState } from "../types";

type ManagerDetailsCache = Record<number, ManagerDetailsState>;

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useManagerDetails(errorFallback: string) {
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(
    null,
  );
  const [detailsCache, setDetailsCache] = useState<ManagerDetailsCache>({});
  const detailsCacheRef = useRef(detailsCache);
  const isMountedRef = useRef(true);
  const requestIdsRef = useRef<Record<number, number>>({});
  detailsCacheRef.current = detailsCache;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDetails = useCallback(
    async (managerId: number) => {
      const requestId = (requestIdsRef.current[managerId] ?? 0) + 1;
      requestIdsRef.current[managerId] = requestId;

      setDetailsCache((currentCache) => ({
        ...currentCache,
        [managerId]: {
          details: currentCache[managerId]?.details ?? null,
          error: "",
          isLoading: true,
        },
      }));

      try {
        const details = await getManagerDetails(managerId);

        if (
          isMountedRef.current &&
          requestIdsRef.current[managerId] === requestId
        ) {
          setDetailsCache((currentCache) => ({
            ...currentCache,
            [managerId]: {
              details,
              error: "",
              isLoading: false,
            },
          }));
        }

        return details;
      } catch (requestError) {
        if (
          isMountedRef.current &&
          requestIdsRef.current[managerId] === requestId
        ) {
          setDetailsCache((currentCache) => ({
            ...currentCache,
            [managerId]: {
              details: null,
              error: getErrorMessage(requestError, errorFallback),
              isLoading: false,
            },
          }));
        }

        return null;
      }
    },
    [errorFallback],
  );

  const openManager = useCallback(
    (managerId: number) => {
      setSelectedManagerId(managerId);

      const cachedState = detailsCacheRef.current[managerId];

      if (!cachedState?.details && !cachedState?.isLoading) {
        void loadDetails(managerId);
      }
    },
    [loadDetails],
  );

  const closeManager = useCallback(() => {
    setSelectedManagerId(null);
  }, []);

  const retryDetails = useCallback(
    (managerId: number) => loadDetails(managerId),
    [loadDetails],
  );

  return {
    closeManager,
    detailsState:
      selectedManagerId === null
        ? null
        : detailsCache[selectedManagerId] ?? {
            details: null,
            error: "",
            isLoading: true,
          },
    openManager,
    retryDetails,
    selectedManagerId,
  };
}
