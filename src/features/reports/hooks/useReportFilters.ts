import { useCallback, useState } from "react";
import type { GetReportsParams, ReportFilters } from "../types";

type UseReportFiltersOptions = {
  onFiltersChange?: () => void;
};

export function createEmptyReportFilters(): ReportFilters {
  return { status: "" };
}

export function getReportFilterParams(
  filters: ReportFilters,
): Pick<GetReportsParams, "status"> {
  return { status: filters.status || undefined };
}

export function useReportFilters({
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
    onFiltersChange?.();
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
