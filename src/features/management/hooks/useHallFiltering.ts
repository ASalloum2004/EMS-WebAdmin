import { useMemo, useState } from "react";
import {
  filterByClientFilters,
  filterBySearchQuery,
  type ClientFilterPredicate,
} from "../../../components";
import type { HallClientFilters } from "../components/ManagementFiltersPanel";
import type { HallApiData } from "../types";

type UseHallFilteringOptions = {
  halls: HallApiData[];
  searchValue: string;
};

function createEmptyHallFilters(): HallClientFilters {
  return {
    maxArea: "",
    minArea: "",
    type: "",
  };
}

function getAreaValidationMessage(filters: HallClientFilters) {
  const hasMinArea = filters.minArea.trim() !== "";
  const hasMaxArea = filters.maxArea.trim() !== "";
  const minArea = Number(filters.minArea);
  const maxArea = Number(filters.maxArea);

  if (hasMinArea && !Number.isFinite(minArea)) {
    return "Enter a valid minimum area.";
  }

  if (hasMaxArea && !Number.isFinite(maxArea)) {
    return "Enter a valid maximum area.";
  }

  if (hasMinArea && hasMaxArea && minArea > maxArea) {
    return "Minimum area cannot be greater than maximum area.";
  }

  return "";
}

export function useHallFiltering({
  halls,
  searchValue,
}: UseHallFilteringOptions) {
  const [filters, setFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [draftFilters, setDraftFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set(
      halls.map((hall) => hall.type).filter((type) => type.trim() !== ""),
    );

    return Array.from(uniqueTypes).sort((firstType, secondType) =>
      firstType.localeCompare(secondType),
    );
  }, [halls]);

  const validationMessage = useMemo(() => {
    return getAreaValidationMessage(draftFilters);
  }, [draftFilters]);

  const activeFilters = useMemo(() => {
    const nextFilters: Array<ClientFilterPredicate<HallApiData>> = [];
    const selectedType = filters.type.trim().toLowerCase();
    const minArea = Number(filters.minArea);
    const maxArea = Number(filters.maxArea);

    if (selectedType) {
      nextFilters.push((hall) => hall.type.toLowerCase() === selectedType);
    }

    if (filters.minArea && Number.isFinite(minArea)) {
      nextFilters.push((hall) => hall.area >= minArea);
    }

    if (filters.maxArea && Number.isFinite(maxArea)) {
      nextFilters.push((hall) => hall.area <= maxArea);
    }

    return nextFilters;
  }, [filters]);

  const filteredByFilters = useMemo(() => {
    return filterByClientFilters(halls, activeFilters);
  }, [activeFilters, halls]);

  const visibleHalls = useMemo(() => {
    return filterBySearchQuery(filteredByFilters, searchValue, (hall) => [
      hall.id,
      hall.number,
      hall.type,
    ]);
  }, [filteredByFilters, searchValue]);

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

    setFilters(draftFilters);
    setIsFilterPanelOpen(false);
  }

  function clearFilters() {
    const emptyFilters = createEmptyHallFilters();

    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  return {
    clearFilters,
    closeFilterPanel,
    draftFilters,
    filters,
    isFilterPanelOpen,
    setDraftFilters,
    toggleFilterPanel,
    typeOptions,
    applyFilters,
    validationMessage,
    visibleHalls,
  };
}
