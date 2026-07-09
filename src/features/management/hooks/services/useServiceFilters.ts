import { useCallback, useMemo, useState } from "react";

type ServicePriceFilters = {
  maxPrice?: number;
  minPrice?: number;
};

type ServiceFilterValidationMessages = {
  invalidPrice: string;
  minGreaterThanMax: string;
};

type UseServiceFiltersOptions = {
  onFiltersChange?: () => void;
  validationMessages: ServiceFilterValidationMessages;
};

function getValidPrice(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const price = Number(trimmedValue);

  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function useServiceFilters({
  onFiltersChange,
  validationMessages,
}: UseServiceFiltersOptions) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<ServicePriceFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterError, setFilterError] = useState("");

  const hasActiveFilters = useMemo(
    () =>
      typeof appliedFilters.minPrice === "number" ||
      typeof appliedFilters.maxPrice === "number",
    [appliedFilters.maxPrice, appliedFilters.minPrice],
  );

  const validateFilters = useCallback(() => {
    const nextMinPrice = getValidPrice(minPrice);
    const nextMaxPrice = getValidPrice(maxPrice);

    if (nextMinPrice === null || nextMaxPrice === null) {
      setFilterError(validationMessages.invalidPrice);
      return null;
    }

    if (
      typeof nextMinPrice === "number" &&
      typeof nextMaxPrice === "number" &&
      nextMinPrice > nextMaxPrice
    ) {
      setFilterError(validationMessages.minGreaterThanMax);
      return null;
    }

    setFilterError("");

    return {
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
    };
  }, [
    maxPrice,
    minPrice,
    validationMessages.invalidPrice,
    validationMessages.minGreaterThanMax,
  ]);

  const openFilters = useCallback(() => {
    setIsFilterOpen(true);
  }, []);

  const closeFilters = useCallback(() => {
    setIsFilterOpen(false);
    setFilterError("");
  }, []);

  const toggleFilters = useCallback(() => {
    setIsFilterOpen((currentIsFilterOpen) => !currentIsFilterOpen);
  }, []);

  const applyFilters = useCallback(() => {
    const validatedFilters = validateFilters();

    if (!validatedFilters) {
      return false;
    }

    setAppliedFilters(validatedFilters);
    setIsFilterOpen(false);
    onFiltersChange?.();

    return true;
  }, [onFiltersChange, validateFilters]);

  const clearFilters = useCallback(() => {
    setMinPrice("");
    setMaxPrice("");
    setAppliedFilters({});
    setFilterError("");
    onFiltersChange?.();
  }, [onFiltersChange]);

  const updateMinPrice = useCallback((nextMinPrice: string) => {
    setMinPrice(nextMinPrice);
    setFilterError("");
  }, []);

  const updateMaxPrice = useCallback((nextMaxPrice: string) => {
    setMaxPrice(nextMaxPrice);
    setFilterError("");
  }, []);

  return {
    minPrice,
    maxPrice,
    setMinPrice: updateMinPrice,
    setMaxPrice: updateMaxPrice,
    appliedMinPrice: appliedFilters.minPrice,
    appliedMaxPrice: appliedFilters.maxPrice,
    isFilterOpen,
    openFilters,
    closeFilters,
    toggleFilters,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    filterError,
    validateFilters,
  };
}
