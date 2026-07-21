import { useCallback, useEffect, useMemo, useState } from "react";
import type { BoothClientFilters, GetBoothsParams } from "../types";

type UseBoothFilteringOptions = {
  onFiltersChange?: () => void;
  validationMessages?: BoothFilterValidationMessages;
};

export type BoothFilterValidationMessages = {
  invalidMaximumArea: string;
  invalidMaximumPrice: string;
  invalidMinimumArea: string;
  invalidMinimumPrice: string;
  minimumAreaGreaterThanMaximum: string;
  minimumPriceGreaterThanMaximum: string;
};

const DEFAULT_BOOTH_FILTER_VALIDATION_MESSAGES: BoothFilterValidationMessages = {
  invalidMaximumArea: "Enter a valid maximum area.",
  invalidMaximumPrice: "Enter a valid maximum price.",
  invalidMinimumArea: "Enter a valid minimum area.",
  invalidMinimumPrice: "Enter a valid minimum price.",
  minimumAreaGreaterThanMaximum:
    "Minimum area cannot be greater than maximum area.",
  minimumPriceGreaterThanMaximum:
    "Minimum price cannot be greater than maximum price.",
};

export const BOOTH_SEARCH_DEBOUNCE_MS = 400;

function createEmptyBoothFilters(): BoothClientFilters {
  return {
    booked: "",
    maxArea: "",
    maxPrice: "",
    minArea: "",
    minPrice: "",
    number: "",
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

function getBoothValidationMessage(
  filters: BoothClientFilters,
  messages: BoothFilterValidationMessages,
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

export function getBoothFilterParams(
  filters: BoothClientFilters,
): Omit<GetBoothsParams, "page" | "perPage"> {
  const number = filters.number.trim();
  const minArea = getOptionalNumber(filters.minArea);
  const maxArea = getOptionalNumber(filters.maxArea);
  const minPrice = getOptionalNumber(filters.minPrice);
  const maxPrice = getOptionalNumber(filters.maxPrice);

  return {
    booked:
      filters.booked === "booked"
        ? true
        : filters.booked === "available"
          ? false
          : undefined,
    maxArea: typeof maxArea === "number" ? maxArea : undefined,
    maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
    minArea: typeof minArea === "number" ? minArea : undefined,
    minPrice: typeof minPrice === "number" ? minPrice : undefined,
    number: number || undefined,
  };
}

export function useBoothFiltering({
  onFiltersChange,
  validationMessages = DEFAULT_BOOTH_FILTER_VALIDATION_MESSAGES,
}: UseBoothFilteringOptions = {}) {
  const [filters, setFilters] = useState<BoothClientFilters>(
    createEmptyBoothFilters,
  );
  const [draftFilters, setDraftFilters] = useState<BoothClientFilters>(
    createEmptyBoothFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchValue, setSearchValueState] = useState("");

  const validationMessage = useMemo(() => {
    return getBoothValidationMessage(draftFilters, validationMessages);
  }, [draftFilters, validationMessages]);

  useEffect(() => {
    const nextNumber = searchValue.trim();

    if (nextNumber === filters.number) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFilters((currentFilters) => ({
        ...currentFilters,
        number: nextNumber,
      }));
      onFiltersChange?.();
    }, BOOTH_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [filters.number, onFiltersChange, searchValue]);

  const setSearchValue = useCallback(
    (value: string) => {
      setSearchValueState(value);

      if (isFilterPanelOpen) {
        setDraftFilters((currentFilters) => ({
          ...currentFilters,
          number: value,
        }));
      }
    },
    [isFilterPanelOpen],
  );

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters({
        ...filters,
        number: searchValue,
      });
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [filters, isFilterPanelOpen, searchValue]);

  const closeFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false);
  }, []);

  const applyFilters = useCallback(() => {
    if (validationMessage) {
      return false;
    }

    const nextFilters = {
      ...draftFilters,
      number: draftFilters.number.trim(),
    };

    setDraftFilters(nextFilters);
    setFilters(nextFilters);
    setSearchValueState(nextFilters.number);
    setIsFilterPanelOpen(false);
    onFiltersChange?.();

    return true;
  }, [draftFilters, onFiltersChange, validationMessage]);

  const clearFilters = useCallback(() => {
    const emptyFilters = createEmptyBoothFilters();

    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setSearchValueState("");
    onFiltersChange?.();
  }, [onFiltersChange]);

  return {
    appliedFilters: filters,
    applyFilters,
    clearFilters,
    closeFilterPanel,
    draftFilters,
    filters,
    isFilterPanelOpen,
    searchValue,
    setDraftFilters,
    setSearchValue,
    toggleFilterPanel,
    validationMessage,
  };
}
