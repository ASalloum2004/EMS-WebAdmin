import { useCallback, useState } from "react";
import type {
  BoothRequestFilters,
  GetBoothRequestsParams,
} from "../types";

type UseBoothRequestFiltersOptions = {
  onFiltersChange?: () => void;
};

export function createEmptyBoothRequestFilters(): BoothRequestFilters {
  return {
    createdDate: "",
    sort: "",
    status: "",
  };
}

export function getBoothRequestFilterParams(
  filters: BoothRequestFilters,
): Pick<GetBoothRequestsParams, "createdDate" | "sort" | "status"> {
  return {
    createdDate: filters.createdDate.trim() || undefined,
    sort: filters.sort || undefined,
    status: filters.status || undefined,
  };
}

export function applyBoothRequestFilters(
  filters: BoothRequestFilters,
  onFiltersChange?: () => void,
) {
  const nextFilters = { ...filters };

  onFiltersChange?.();

  return nextFilters;
}

export function clearBoothRequestFilters(
  onFiltersChange?: () => void,
) {
  const nextFilters = createEmptyBoothRequestFilters();

  onFiltersChange?.();

  return nextFilters;
}

export function useBoothRequestFilters({
  onFiltersChange,
}: UseBoothRequestFiltersOptions = {}) {
  const [appliedFilters, setAppliedFilters] =
    useState<BoothRequestFilters>(createEmptyBoothRequestFilters);
  const [draftFilters, setDraftFilters] =
    useState<BoothRequestFilters>(createEmptyBoothRequestFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters(appliedFilters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [appliedFilters, isFilterPanelOpen]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(
      applyBoothRequestFilters(draftFilters, onFiltersChange),
    );
    setIsFilterPanelOpen(false);
  }, [draftFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters = clearBoothRequestFilters(onFiltersChange);

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }, [onFiltersChange]);

  return {
    appliedFilters,
    applyFilters,
    clearFilters,
    draftFilters,
    isFilterPanelOpen,
    setDraftFilters,
    toggleFilterPanel,
  };
}
