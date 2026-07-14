import { useCallback, useMemo, useState } from "react";

type ServiceActiveStatus = "" | "active" | "inactive";

type ServiceFilters = {
  isActive?: boolean;
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

function getIsActiveFilter(activeStatus: ServiceActiveStatus) {
  if (activeStatus === "active") {
    return true;
  }

  if (activeStatus === "inactive") {
    return false;
  }

  return undefined;
}

export function useServiceFilters({
  onFiltersChange,
  validationMessages,
}: UseServiceFiltersOptions) {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeStatus, setActiveStatus] = useState<ServiceActiveStatus>("");
  const [appliedFilters, setAppliedFilters] = useState<ServiceFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterError, setFilterError] = useState("");

  const hasActiveFilters = useMemo(
    () =>
      typeof appliedFilters.minPrice === "number" ||
      typeof appliedFilters.maxPrice === "number" ||
      typeof appliedFilters.isActive === "boolean",
    [
      appliedFilters.isActive,
      appliedFilters.maxPrice,
      appliedFilters.minPrice,
    ],
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
      isActive: getIsActiveFilter(activeStatus),
      minPrice: nextMinPrice,
      maxPrice: nextMaxPrice,
    };
  }, [
    activeStatus,
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
    setActiveStatus("");
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

  const updateActiveStatus = useCallback((nextActiveStatus: string) => {
    setActiveStatus(
      nextActiveStatus === "active" || nextActiveStatus === "inactive"
        ? nextActiveStatus
        : "",
    );
    setFilterError("");
  }, []);

  return {
    minPrice,
    maxPrice,
    activeStatus,
    setMinPrice: updateMinPrice,
    setMaxPrice: updateMaxPrice,
    setActiveStatus: updateActiveStatus,
    appliedMinPrice: appliedFilters.minPrice,
    appliedMaxPrice: appliedFilters.maxPrice,
    appliedIsActive: appliedFilters.isActive,
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
