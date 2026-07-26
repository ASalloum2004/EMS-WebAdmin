import { useCallback, useState } from "react";
import type {
  GetVisitorsParams,
  VisitorFilters,
} from "../types";

type UseVisitorFiltersOptions = {
  onFiltersChange?: () => void;
};

export function createEmptyVisitorFilters(): VisitorFilters {
  return {
    gender: "",
    job: "",
    location: "",
  };
}

export function getVisitorFilterParams(
  filters: VisitorFilters,
): Pick<GetVisitorsParams, "gender" | "job" | "location"> {
  return {
    gender: filters.gender || undefined,
    job: filters.job.trim() || undefined,
    location: filters.location.trim() || undefined,
  };
}

export function applyVisitorFilters(
  filters: VisitorFilters,
  onFiltersChange?: () => void,
) {
  const nextFilters: VisitorFilters = {
    gender: filters.gender,
    job: filters.job.trim(),
    location: filters.location.trim(),
  };

  onFiltersChange?.();
  return nextFilters;
}

export function clearVisitorFilters(onFiltersChange?: () => void) {
  const nextFilters = createEmptyVisitorFilters();

  onFiltersChange?.();
  return nextFilters;
}

export function useVisitorFilters({
  onFiltersChange,
}: UseVisitorFiltersOptions = {}) {
  const [appliedFilters, setAppliedFilters] = useState<VisitorFilters>(
    createEmptyVisitorFilters,
  );
  const [draftFilters, setDraftFilters] = useState<VisitorFilters>(
    createEmptyVisitorFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const toggleFilterPanel = useCallback(() => {
    if (!isFilterPanelOpen) {
      setDraftFilters(appliedFilters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }, [appliedFilters, isFilterPanelOpen]);

  const applyFilters = useCallback(() => {
    const nextFilters = applyVisitorFilters(
      draftFilters,
      onFiltersChange,
    );

    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setIsFilterPanelOpen(false);
  }, [draftFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const emptyFilters = clearVisitorFilters(onFiltersChange);

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
