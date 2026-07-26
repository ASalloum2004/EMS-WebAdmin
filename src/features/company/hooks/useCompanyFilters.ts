import { useCallback, useState } from "react";
import type { CompanyFilters, GetCompaniesParams } from "../types";

type UseCompanyFiltersOptions = {
  onFiltersChange?: () => void;
};

export function createEmptyCompanyFilters(): CompanyFilters {
  return {
    businessSector: "",
    status: "",
  };
}

export function getCompanyFilterParams(
  filters: CompanyFilters,
): Pick<GetCompaniesParams, "businessSector" | "status"> {
  return {
    businessSector: filters.businessSector.trim() || undefined,
    status: filters.status || undefined,
  };
}

export function applyCompanyFilters(
  filters: CompanyFilters,
  onFiltersChange?: () => void,
) {
  const nextFilters: CompanyFilters = {
    businessSector: filters.businessSector.trim(),
    status: filters.status,
  };

  onFiltersChange?.();
  return nextFilters;
}

export function clearCompanyFilters(onFiltersChange?: () => void) {
  const nextFilters = createEmptyCompanyFilters();

  onFiltersChange?.();
  return nextFilters;
}

export function useCompanyFilters({
  onFiltersChange,
}: UseCompanyFiltersOptions = {}) {
  const [appliedFilters, setAppliedFilters] = useState<CompanyFilters>(
    createEmptyCompanyFilters,
  );
  const [draftFilters, setDraftFilters] = useState<CompanyFilters>(
    createEmptyCompanyFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters(appliedFilters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [appliedFilters, isFilterPanelOpen]);

  const applyFilters = useCallback(() => {
    const nextFilters = applyCompanyFilters(
      draftFilters,
      onFiltersChange,
    );

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setIsFilterPanelOpen(false);
  }, [draftFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters = clearCompanyFilters(onFiltersChange);

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
