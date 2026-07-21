import { useMemo, useState } from "react";
import { filterBySearchQuery } from "../../../components";
import type { BoothApiData, BoothClientFilters } from "../types";

type UseBoothFilteringOptions = {
  booths: BoothApiData[];
  onFiltersChange?: () => void;
  refetchBooths: () => Promise<BoothApiData[]>;
  searchValue: string;
  validationMessages?: BoothFilterValidationMessages;
};

type BoothFilterValidationMessages = {
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
    return null;
  }

  const numericValue = Number(trimmedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getInvalidNumberMessage(value: string, message: string) {
  if (!value.trim()) {
    return "";
  }

  return Number.isFinite(Number(value)) ? "" : message;
}

function getBoothValidationMessage(
  filters: BoothClientFilters,
  messages: BoothFilterValidationMessages,
) {
  const invalidMinArea = getInvalidNumberMessage(
    filters.minArea,
    messages.invalidMinimumArea,
  );
  const invalidMaxArea = getInvalidNumberMessage(
    filters.maxArea,
    messages.invalidMaximumArea,
  );
  const invalidMinPrice = getInvalidNumberMessage(
    filters.minPrice,
    messages.invalidMinimumPrice,
  );
  const invalidMaxPrice = getInvalidNumberMessage(
    filters.maxPrice,
    messages.invalidMaximumPrice,
  );

  if (invalidMinArea) {
    return invalidMinArea;
  }

  if (invalidMaxArea) {
    return invalidMaxArea;
  }

  if (invalidMinPrice) {
    return invalidMinPrice;
  }

  if (invalidMaxPrice) {
    return invalidMaxPrice;
  }

  const minArea = getOptionalNumber(filters.minArea);
  const maxArea = getOptionalNumber(filters.maxArea);
  const minPrice = getOptionalNumber(filters.minPrice);
  const maxPrice = getOptionalNumber(filters.maxPrice);

  if (minArea !== null && maxArea !== null && minArea > maxArea) {
    return messages.minimumAreaGreaterThanMaximum;
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return messages.minimumPriceGreaterThanMaximum;
  }

  return "";
}

function filterBoothsLocally(
  booths: BoothApiData[],
  filters: BoothClientFilters,
) {
  const boothNumber = filters.number.trim().toLowerCase();
  const minArea = getOptionalNumber(filters.minArea);
  const maxArea = getOptionalNumber(filters.maxArea);
  const minPrice = getOptionalNumber(filters.minPrice);
  const maxPrice = getOptionalNumber(filters.maxPrice);

  return booths.filter((booth) => {
    const boothPrice = Number(booth.price);

    if (
      boothNumber &&
      !booth.number.toLowerCase().includes(boothNumber)
    ) {
      return false;
    }

    if (filters.booked === "booked" && booth.is_booked !== true) {
      return false;
    }

    if (filters.booked === "available" && booth.is_booked !== false) {
      return false;
    }

    if (minArea !== null && booth.area < minArea) {
      return false;
    }

    if (maxArea !== null && booth.area > maxArea) {
      return false;
    }

    if (minPrice !== null && !Number.isFinite(boothPrice)) {
      return false;
    }

    if (maxPrice !== null && !Number.isFinite(boothPrice)) {
      return false;
    }

    if (minPrice !== null && boothPrice < minPrice) {
      return false;
    }

    if (maxPrice !== null && boothPrice > maxPrice) {
      return false;
    }

    return true;
  });
}

export function useBoothFiltering({
  booths,
  onFiltersChange,
  refetchBooths,
  searchValue,
  validationMessages = DEFAULT_BOOTH_FILTER_VALIDATION_MESSAGES,
}: UseBoothFilteringOptions) {
  const [filters, setFilters] = useState<BoothClientFilters>(
    createEmptyBoothFilters,
  );
  const [draftFilters, setDraftFilters] = useState<BoothClientFilters>(
    createEmptyBoothFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const validationMessage = useMemo(() => {
    return getBoothValidationMessage(draftFilters, validationMessages);
  }, [draftFilters, validationMessages]);

  const locallyFilteredBooths = useMemo(() => {
    // Search and filters intentionally apply only to the current backend page.
    return filterBoothsLocally(booths, filters);
  }, [booths, filters]);

  const visibleBooths = useMemo(() => {
    return filterBySearchQuery(locallyFilteredBooths, searchValue, (booth) => [
      booth.id,
      booth.number,
    ]);
  }, [locallyFilteredBooths, searchValue]);

  function toggleFilterPanel() {
    if (!isFilterPanelOpen) {
      setDraftFilters(filters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }

  function closeFilterPanel() {
    setIsFilterPanelOpen(false);
  }

  function applyFilters() {
    if (validationMessage) {
      return;
    }

    const nextFilters = draftFilters;

    setFilters(nextFilters);
    setIsFilterPanelOpen(false);
    onFiltersChange?.();
  }

  function clearFilters() {
    const emptyFilters = createEmptyBoothFilters();

    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    onFiltersChange?.();
  }

  function refetchFilteredBooths() {
    return refetchBooths();
  }

  return {
    applyFilters,
    clearFilters,
    closeFilterPanel,
    draftFilters,
    filters,
    isFilterPanelOpen,
    refetchFilteredBooths,
    setDraftFilters,
    toggleFilterPanel,
    validationMessage,
    visibleBooths,
  };
}
