import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getEventHalls } from "../api";
import type {
  EventHall,
  EventHallClientFilters,
  GetEventHallsParams,
} from "../types";

type EventHallFilterValidationMessages = {
  invalidMaximumArea: string;
  invalidMaximumPrice: string;
  invalidMinimumArea: string;
  invalidMinimumPrice: string;
  minimumAreaGreaterThanMaximum: string;
  minimumPriceGreaterThanMaximum: string;
};

type UseEventHallsOptions = {
  enabled?: boolean;
  errorFallback: string;
  validationMessages: EventHallFilterValidationMessages;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallbackMessage;
}

function createEmptyEventHallFilters(): EventHallClientFilters {
  return {
    maxArea: "",
    maxPrice: "",
    minArea: "",
    minPrice: "",
  };
}

function getOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const numericValue = Number(trimmedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getEventHallValidationMessage(
  filters: EventHallClientFilters,
  messages: EventHallFilterValidationMessages,
) {
  const minArea = getOptionalNumber(filters.minArea);
  const maxArea = getOptionalNumber(filters.maxArea);
  const minPrice = getOptionalNumber(filters.minPrice);
  const maxPrice = getOptionalNumber(filters.maxPrice);

  if (minArea === null) {
    return messages.invalidMinimumArea;
  }

  if (maxArea === null) {
    return messages.invalidMaximumArea;
  }

  if (minPrice === null) {
    return messages.invalidMinimumPrice;
  }

  if (maxPrice === null) {
    return messages.invalidMaximumPrice;
  }

  if (
    typeof minArea === "number" &&
    typeof maxArea === "number" &&
    minArea > maxArea
  ) {
    return messages.minimumAreaGreaterThanMaximum;
  }

  if (
    typeof minPrice === "number" &&
    typeof maxPrice === "number" &&
    minPrice > maxPrice
  ) {
    return messages.minimumPriceGreaterThanMaximum;
  }

  return "";
}

function getEventHallParams(
  filters: EventHallClientFilters,
): GetEventHallsParams {
  const minArea = getOptionalNumber(filters.minArea);
  const maxArea = getOptionalNumber(filters.maxArea);
  const minPrice = getOptionalNumber(filters.minPrice);
  const maxPrice = getOptionalNumber(filters.maxPrice);

  return {
    minArea: typeof minArea === "number" ? minArea : undefined,
    maxArea: typeof maxArea === "number" ? maxArea : undefined,
    minPrice: typeof minPrice === "number" ? minPrice : undefined,
    maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
  };
}

export function isLatestEventHallsRequest(
  requestId: number,
  latestRequestId: number,
) {
  return requestId === latestRequestId;
}

export function useEventHalls({
  enabled = true,
  errorFallback,
  validationMessages,
}: UseEventHallsOptions) {
  const [eventHalls, setEventHalls] = useState<EventHall[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<EventHallClientFilters>(
    createEmptyEventHallFilters,
  );
  const [draftFilters, setDraftFilters] = useState<EventHallClientFilters>(
    createEmptyEventHallFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const hasRequestedEventHalls = useRef(false);
  const appliedParamsRef = useRef<GetEventHallsParams>({});
  const latestRequestIdRef = useRef(0);

  const validationMessage = useMemo(
    () => getEventHallValidationMessage(draftFilters, validationMessages),
    [draftFilters, validationMessages],
  );

  const requestEventHalls = useCallback(
    async (params: GetEventHallsParams) => {
      if (!enabled) {
        return [];
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      setError("");
      setIsLoading(true);

      try {
        const nextEventHalls = await getEventHalls(params);

        if (
          isLatestEventHallsRequest(requestId, latestRequestIdRef.current)
        ) {
          setEventHalls(nextEventHalls);
        }

        return nextEventHalls;
      } catch (eventHallsError) {
        if (
          isLatestEventHallsRequest(requestId, latestRequestIdRef.current)
        ) {
          setError(getErrorMessage(eventHallsError, errorFallback));
          setEventHalls([]);
        }

        return [];
      } finally {
        if (
          isLatestEventHallsRequest(requestId, latestRequestIdRef.current)
        ) {
          setIsLoading(false);
        }
      }
    },
    [enabled, errorFallback],
  );

  const refetch = useCallback(() => {
    return requestEventHalls(appliedParamsRef.current);
  }, [requestEventHalls]);

  useEffect(() => {
    if (!enabled || hasRequestedEventHalls.current) {
      return;
    }

    hasRequestedEventHalls.current = true;
    void refetch();
  }, [enabled, refetch]);

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters(filters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [filters, isFilterPanelOpen]);

  const closeFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    if (validationMessage) {
      return false;
    }

    const nextFilters = { ...draftFilters };
    const nextParams = getEventHallParams(nextFilters);

    setFilters(nextFilters);
    appliedParamsRef.current = nextParams;
    setIsFilterPanelOpen(false);
    void requestEventHalls(nextParams);

    return true;
  }, [draftFilters, requestEventHalls, validationMessage]);

  const clearFilters = useCallback(() => {
    const emptyFilters = createEmptyEventHallFilters();
    const emptyParams: GetEventHallsParams = {};

    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    appliedParamsRef.current = emptyParams;
    void requestEventHalls(emptyParams);
  }, [requestEventHalls]);

  return {
    applyFilters,
    clearFilters,
    closeFilterPanel,
    draftFilters,
    eventHalls,
    error,
    filters,
    isFilterPanelOpen,
    isLoading,
    refetch,
    setDraftFilters,
    toggleFilterPanel,
    validationMessage,
  };
}
