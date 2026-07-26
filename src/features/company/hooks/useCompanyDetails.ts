import { useCallback, useEffect, useRef, useState } from "react";
import { getCompanyDetails } from "../api";
import type { CompanyDetailsState } from "../types";

type CompanyDetailsCache = Record<number, CompanyDetailsState>;

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error.message : fallbackMessage;
}

export function useCompanyDetails(errorFallback: string) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [detailsCache, setDetailsCache] = useState<CompanyDetailsCache>({});
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
    async (companyId: number) => {
      const requestId = (requestIdsRef.current[companyId] ?? 0) + 1;
      requestIdsRef.current[companyId] = requestId;

      setDetailsCache((currentCache) => ({
        ...currentCache,
        [companyId]: {
          details: currentCache[companyId]?.details ?? null,
          error: "",
          isLoading: true,
        },
      }));

      try {
        const details = await getCompanyDetails(companyId);

        if (
          isMountedRef.current &&
          requestIdsRef.current[companyId] === requestId
        ) {
          setDetailsCache((currentCache) => ({
            ...currentCache,
            [companyId]: {
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
          requestIdsRef.current[companyId] === requestId
        ) {
          setDetailsCache((currentCache) => ({
            ...currentCache,
            [companyId]: {
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

  const openCompany = useCallback(
    (companyId: number) => {
      setSelectedCompanyId(companyId);

      const cachedState = detailsCacheRef.current[companyId];

      if (!cachedState?.details && !cachedState?.isLoading) {
        void loadDetails(companyId);
      }
    },
    [loadDetails],
  );

  const closeCompany = useCallback(() => {
    setSelectedCompanyId(null);
  }, []);

  const retryDetails = useCallback(
    (companyId: number) => loadDetails(companyId),
    [loadDetails],
  );

  return {
    closeCompany,
    detailsState:
      selectedCompanyId === null
        ? null
        : detailsCache[selectedCompanyId] ?? {
            details: null,
            error: "",
            isLoading: true,
          },
    openCompany,
    retryDetails,
    selectedCompanyId,
  };
}
