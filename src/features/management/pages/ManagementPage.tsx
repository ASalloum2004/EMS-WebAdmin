import { useMemo, useState } from "react";
import {
  filterByClientFilters,
  filterBySearchQuery,
  type ClientFilterPredicate,
} from "../../../components";
import { ManagementBoothEditModal } from "../components/ManagementBoothEditModal";
import { ManagementBoothList } from "../components/ManagementBoothList";
import {
  ManagementFiltersPanel,
  type HallClientFilters,
} from "../components/ManagementFiltersPanel";
import { ManagementList } from "../components/ManagementList";
import { ManagementSearchBar } from "../components/ManagementSearchBar";
import { ManagementHeader } from "../components/ManagementHeader";
import { ManagementTabs, type ManagementTab } from "../components/ManagementTabs";
import { useBooths, useHalls } from "../hooks";
import type { BoothApiData, HallApiData, UpdateBoothPayload } from "../types";
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
  const [activeTab, setActiveTab] = useState<ManagementTab>("Hall");
  const isHallTab = activeTab === "Hall";
  const isBoothTab = activeTab === "Booth";
  const isAllTab = activeTab === "All";
  const {
    error: hallsError,
    halls,
    isLoading: isHallsLoading,
    refetch: refetchHalls,
  } = useHalls();
  const {
    booths,
    clearUpdateError,
    error: boothsError,
    isLoading: isBoothsLoading,
    isUpdating: isUpdatingBooth,
    refetch: refetchBooths,
    updateBoothById,
    updateError: boothUpdateError,
  } = useBooths({ enabled: isBoothTab });
  const [filters, setFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [draftFilters, setDraftFilters] = useState<HallClientFilters>(
    createEmptyHallFilters,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<BoothApiData | null>(null);
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
  const visibleBooths = useMemo(() => {
    return filterBySearchQuery(booths, searchValue, (booth) => [
      booth.id,
      booth.number,
    ]);
  }, [booths, searchValue]);
  const hasHalls = visibleHalls.length > 0;
  const hasBooths = visibleBooths.length > 0;

  const searchPlaceholder = isBoothTab
    ? "Search by id or number..."
    : isHallTab
      ? "Search by id, number, or type..."
      : "Search management...";
  const searchAriaLabel = isBoothTab
    ? "Search booths"
    : isHallTab
      ? "Search halls"
      : "Search management";

  function handleTabChange(tab: ManagementTab) {
    setActiveTab(tab);
    setIsFilterPanelOpen(false);
  }

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

  function handleEditBooth(booth: BoothApiData) {
    clearUpdateError();
    setSelectedBooth(booth);
  }

  function handleCancelBoothEdit() {
    clearUpdateError();
    setSelectedBooth(null);
  }

  async function handleSaveBooth(payload: UpdateBoothPayload) {
    if (!selectedBooth) {
      return;
    }

    const updatedBooth = await updateBoothById(selectedBooth.id, payload);

    if (updatedBooth) {
      setSelectedBooth(null);
    }
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
            <ManagementTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          <div className="management-page__search">
            <ManagementSearchBar
              value={searchValue}
              onChange={setSearchValue}
              inputAriaLabel={searchAriaLabel}
              onFilterClick={isHallTab ? handleFilterToggle : undefined}
              placeholder={searchPlaceholder}
              showFilterButton={isHallTab || isBoothTab}
            />

            {isHallTab && isFilterPanelOpen ? (
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

        {isHallTab && isHallsLoading ? (
          <p className="management-page__state">Loading halls...</p>
        ) : null}

        {isHallTab && !isHallsLoading && hallsError ? (
          <div className="management-page__state" role="alert">
            <p>{hallsError}</p>
            <button type="button" onClick={() => void refetchHalls()}>
              Try again
            </button>
          </div>
        ) : null}

        {isHallTab && !isHallsLoading && !hallsError && !hasHalls ? (
          <p className="management-page__state">No halls found.</p>
        ) : null}

        {isHallTab && !isHallsLoading && !hallsError && hasHalls ? (
          <ManagementList halls={visibleHalls} />
        ) : null}

        {isBoothTab && isBoothsLoading ? (
          <p className="management-page__state">Loading booths...</p>
        ) : null}

        {isBoothTab && !isBoothsLoading && boothsError ? (
          <div className="management-page__state" role="alert">
            <p>{boothsError}</p>
            <button type="button" onClick={() => void refetchBooths()}>
              Try again
            </button>
          </div>
        ) : null}

        {isBoothTab && !isBoothsLoading && !boothsError && !hasBooths ? (
          <p className="management-page__state">No booths found.</p>
        ) : null}

        {isBoothTab && !isBoothsLoading && !boothsError && hasBooths ? (
          <ManagementBoothList
            booths={visibleBooths}
            onEditBooth={handleEditBooth}
          />
        ) : null}

        {isAllTab ? (
          <p className="management-page__state">
            All management items will appear here.
          </p>
        ) : null}
      </section>

      {selectedBooth ? (
        <ManagementBoothEditModal
          booth={selectedBooth}
          error={boothUpdateError}
          isSubmitting={isUpdatingBooth}
          onCancel={handleCancelBoothEdit}
          onSave={handleSaveBooth}
        />
      ) : null}
    </div>
  );
}
