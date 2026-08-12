import { useCallback, useState } from "react";
import type { GetReportsParams, ReportFilters } from "../types";

type UseReportFiltersOptions = {
  onClear?: () => void;
  onFiltersChange?: () => void;
};

export function createEmptyReportFilters(): ReportFilters {
  return {
    createdDate: "",
    status: "",
  };
}

export function getReportFilterParams(
  filters: ReportFilters,
): Pick<GetReportsParams, "createdDate" | "status"> {
  return {
    createdDate: filters.createdDate.trim() || undefined,
    status: filters.status || undefined,
  };
}

export function useReportFilters({
  onClear,
  onFiltersChange,
}: UseReportFiltersOptions = {}) {
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(
    createEmptyReportFilters,
  );
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(
    createEmptyReportFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters(appliedFilters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [appliedFilters, isFilterPanelOpen]);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...draftFilters });
    setIsFilterPanelOpen(false);
    onFiltersChange?.();
  }, [draftFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters = createEmptyReportFilters();

    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    onClear?.();
    onFiltersChange?.();
  }, [onClear, onFiltersChange]);

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
