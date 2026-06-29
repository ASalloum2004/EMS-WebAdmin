import { useMemo, useState } from "react";
import {
  filterByClientFilters,
  filterBySearchQuery,
  type ClientFilterPredicate,
} from "../../../components";
import {
  ManagementFiltersPanel,
  type HallClientFilters,
} from "../components/ManagementFiltersPanel";
import { ManagementList } from "../components/ManagementList";
import { ManagementSearchBar } from "../components/ManagementSearchBar";
import { ManagementHeader } from "../components/ManagementHeader";
import { ManagementTabs } from "../components/ManagementTabs";
import { useHalls } from "../hooks";
import type { HallApiData } from "../types";
import "./ManagementPage.scss";

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

export function ManagementPage() {
  const { error, halls, isLoading, refetch } = useHalls();
  const [filters, setFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [draftFilters, setDraftFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set(
      halls.map((hall) => hall.type).filter((type) => type.trim() !== ""),
    );

    return Array.from(uniqueTypes).sort((firstType, secondType) =>
      firstType.localeCompare(secondType),
    );
  }, [halls]);

  const filterValidationMessage = useMemo(() => {
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
  const hasHalls = visibleHalls.length > 0;

  function handleFilterToggle() {
    if (!isFilterPanelOpen) {
      setDraftFilters(filters);
    }

    setIsFilterPanelOpen((isOpen) => !isOpen);
  }

  function handleApplyFilters() {
    if (filterValidationMessage) {
      return;
    }

    setFilters(draftFilters);
    setIsFilterPanelOpen(false);
  }

  function handleClearFilters() {
    const emptyFilters = createEmptyHallFilters();

    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  return (
    <div className="management-page">
      <ManagementHeader
        title="Halls & Booth Management"
        description="View and manage exhibition halls, booth areas, and space allocation details"
        actionLabel="Services"
      />

      <section className="management-page__panel" aria-label="Management list">
        <div className="management-page__controls">
          <div className="management-page__filters">
            <ManagementTabs />
          </div>

          <div className="management-page__search">
            <ManagementSearchBar
              value={searchValue}
              onChange={setSearchValue}
              onFilterClick={handleFilterToggle}
            />

            {isFilterPanelOpen ? (
              <ManagementFiltersPanel
                filters={draftFilters}
                onApply={handleApplyFilters}
                onChange={setDraftFilters}
                onClear={handleClearFilters}
                typeOptions={typeOptions}
                validationMessage={filterValidationMessage}
              />
            ) : null}
          </div>
        </div>

        <div className="management-page__divider" />

        {isLoading ? (
          <p className="management-page__state">Loading halls...</p>
        ) : null}

        {!isLoading && error ? (
          <div className="management-page__state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && !hasHalls ? (
          <p className="management-page__state">No halls found.</p>
        ) : null}

        {!isLoading && !error && hasHalls ? (
          <ManagementList halls={visibleHalls} />
        ) : null}
      </section>
    </div>
  );
}
