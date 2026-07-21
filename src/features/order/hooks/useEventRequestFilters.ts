import { useCallback, useState } from "react";
import type {
  EventRequestFilters,
  GetEventRequestsParams,
} from "../types";

type UseEventRequestFiltersOptions = {
  onFiltersChange?: () => void;
};

export function createEmptyEventRequestFilters(): EventRequestFilters {
  return {
    createdDate: "",
    sort: "",
    status: "",
  };
}

export function getEventRequestFilterParams(
  filters: EventRequestFilters,
): Pick<GetEventRequestsParams, "createdDate" | "sort" | "status"> {
  return {
    createdDate: filters.createdDate.trim() || undefined,
    sort: filters.sort || undefined,
    status: filters.status || undefined,
  };
}

export function useEventRequestFilters({
  onFiltersChange,
}: UseEventRequestFiltersOptions = {}) {
  const [appliedFilters, setAppliedFilters] =
    useState<EventRequestFilters>(createEmptyEventRequestFilters);
  const [draftFilters, setDraftFilters] =
    useState<EventRequestFilters>(createEmptyEventRequestFilters);
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
    const emptyFilters = createEmptyEventRequestFilters();

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
