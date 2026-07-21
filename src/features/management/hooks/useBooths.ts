import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BOOTHS_PER_PAGE,
  getBooths,
} from "../api/boothsApi";
import { updateBooth } from "../api/updateBoothApi";
import type {
  BoothApiData,
  BoothsPagination,
  GetBoothsParams,
  GetBoothsResult,
  UpdateBoothPayload,
} from "../types";
import {
  getBoothFilterParams,
  useBoothFiltering,
  type BoothFilterValidationMessages,
} from "./useBoothFiltering";

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getRequestKey(params: GetBoothsParams) {
  return JSON.stringify(params);
}

export function isLatestBoothsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

type UseBoothsOptions = {
  enabled?: boolean;
  validationMessages?: BoothFilterValidationMessages;
};

const initialPagination: BoothsPagination = {
  currentPage: 1,
  perPage: DEFAULT_BOOTHS_PER_PAGE,
  totalItems: 0,
  totalPages: 1,
};

export function useBooths({
  enabled = true,
  validationMessages,
}: UseBoothsOptions = {}) {
  const [booths, setBooths] = useState<BoothApiData[]>([]);
  const [pagination, setPagination] =
    useState<BoothsPagination>(initialPagination);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const requestIdRef = useRef(0);
  const automaticRequestKeyRef = useRef<string | null>(null);
  const requestParamsRef = useRef<GetBoothsParams>({
    page: initialPagination.currentPage,
    perPage: initialPagination.perPage,
  });
  const boothsRef = useRef(booths);
  const paginationRef = useRef(pagination);
  const isUpdatingRef = useRef(false);
  const currentPage = pagination.currentPage;
  const perPage = pagination.perPage;

  boothsRef.current = booths;
  paginationRef.current = pagination;

  const resetPagination = useCallback(() => {
    setPagination((currentPagination) => {
      if (currentPagination.currentPage === 1) {
        return currentPagination;
      }

      return {
        ...currentPagination,
        currentPage: 1,
      };
    });
  }, []);
  const filters = useBoothFiltering({
    onFiltersChange: resetPagination,
    validationMessages,
  });
  const filterParams = getBoothFilterParams(filters.appliedFilters);
  const booked = filterParams.booked;
  const maxArea = filterParams.maxArea;
  const maxPrice = filterParams.maxPrice;
  const minArea = filterParams.minArea;
  const minPrice = filterParams.minPrice;
  const number = filterParams.number;

  const requestParams = useMemo<GetBoothsParams>(
    () => ({
      booked,
      maxArea,
      maxPrice,
      minArea,
      minPrice,
      number,
      page: currentPage,
      perPage,
    }),
    [
      booked,
      currentPage,
      maxArea,
      maxPrice,
      minArea,
      minPrice,
      number,
      perPage,
    ],
  );
  requestParamsRef.current = requestParams;

  const requestBooths = useCallback(
    async (params: GetBoothsParams) => {
      if (!enabled) {
        return {
          booths: boothsRef.current,
          pagination: paginationRef.current,
        } satisfies GetBoothsResult;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const result = await getBooths(params);

        if (isLatestBoothsRequest(requestId, requestIdRef.current)) {
          setBooths(result.booths);
          setPagination(result.pagination);
        }

        return result;
      } catch (boothsError) {
        const preservedResult = {
          booths: [],
          pagination: {
            currentPage: params.page ?? paginationRef.current.currentPage,
            perPage: params.perPage ?? paginationRef.current.perPage,
            totalItems: paginationRef.current.totalItems,
            totalPages: paginationRef.current.totalPages,
          },
        } satisfies GetBoothsResult;

        if (isLatestBoothsRequest(requestId, requestIdRef.current)) {
          setError(getErrorMessage(boothsError, "Unable to load booths."));
          setBooths([]);
        }

        return preservedResult;
      } finally {
        if (isLatestBoothsRequest(requestId, requestIdRef.current)) {
          setIsLoading(false);
        }
      }
    },
    [enabled],
  );

  const refetch = useCallback(async () => {
    const result = await requestBooths(requestParamsRef.current);

    return result.booths;
  }, [requestBooths]);

  const updateBoothById = useCallback(
    async (boothId: number, payload: UpdateBoothPayload) => {
      if (isUpdatingRef.current) {
        return null;
      }

      isUpdatingRef.current = true;
      setUpdateError("");
      setIsUpdating(true);

      try {
        const updatedBooth = await updateBooth(boothId, payload);
        await requestBooths(requestParamsRef.current);

        return updatedBooth;
      } catch (boothError) {
        setUpdateError(getErrorMessage(boothError, "Unable to update booth."));
        return null;
      } finally {
        isUpdatingRef.current = false;
        setIsUpdating(false);
      }
    },
    [requestBooths],
  );

  const clearUpdateError = useCallback(() => {
    setUpdateError("");
  }, []);

  useEffect(() => {
    if (enabled) {
      return;
    }

    requestIdRef.current += 1;
    automaticRequestKeyRef.current = null;
    setIsLoading(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestKey = getRequestKey(requestParams);

    if (automaticRequestKeyRef.current === requestKey) {
      return;
    }

    automaticRequestKeyRef.current = requestKey;
    void requestBooths(requestParams);
  }, [enabled, requestBooths, requestParams]);

  const setCurrentPage = useCallback((page: number) => {
    setPagination((currentPagination) => {
      const nextPage = Math.min(
        clampPositiveInteger(page),
        currentPagination.totalPages,
      );

      if (nextPage === currentPagination.currentPage) {
        return currentPagination;
      }

      return {
        ...currentPagination,
        currentPage: nextPage,
      };
    });
  }, []);

  return {
    booths,
    clearUpdateError,
    currentPage: pagination.currentPage,
    error,
    filters,
    isLoading,
    isUpdating,
    perPage: pagination.perPage,
    refetch,
    searchValue: filters.searchValue,
    setCurrentPage,
    setSearchValue: filters.setSearchValue,
    totalItems: pagination.totalItems,
    totalPages: pagination.totalPages,
    updateBoothById,
    updateError,
  };
}
