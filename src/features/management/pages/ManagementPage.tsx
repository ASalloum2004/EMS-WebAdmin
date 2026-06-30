import { useMemo, useState } from "react";
import { DataTable, SearchFilterBar } from "../../../components";
import { ManagementBoothEditModal } from "../components/ManagementBoothEditModal";
import { ManagementBoothFiltersPanel } from "../components/ManagementBoothFiltersPanel";
import { ManagementFiltersPanel } from "../components/ManagementFiltersPanel";
import { ManagementHeader } from "../components/ManagementHeader";
import {
  ManagementTabs,
  type ManagementTab,
} from "../components/ManagementTabs";
import {
  useBoothEditing,
  useBoothFiltering,
  useBooths,
  useHallFiltering,
  useHalls,
} from "../hooks";
import {
  boothColumns,
  getBoothActions,
  hallColumns,
} from "../components/tableColumns";
import "./ManagementPage.scss";

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
  const [searchValue, setSearchValue] = useState("");
  const hallFiltering = useHallFiltering({ halls, searchValue });
  const boothEditing = useBoothEditing({
    clearUpdateError,
    updateBoothById,
  });
  const boothFiltering = useBoothFiltering({
    booths,
    refetchBooths,
    searchValue,
  });
  const boothActions = useMemo(() => {
    return getBoothActions(boothEditing.openEditModal);
  }, [boothEditing.openEditModal]);
  const hasHalls = hallFiltering.visibleHalls.length > 0;
  const hasBooths = boothFiltering.visibleBooths.length > 0;

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
    hallFiltering.closeFilterPanel();
    boothFiltering.closeFilterPanel();
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
            <SearchFilterBar
              value={searchValue}
              onChange={setSearchValue}
              inputAriaLabel={searchAriaLabel}
              onFilterClick={
                isHallTab
                  ? hallFiltering.toggleFilterPanel
                  : isBoothTab
                    ? boothFiltering.toggleFilterPanel
                    : undefined
              }
              placeholder={searchPlaceholder}
              showFilterButton={isHallTab || isBoothTab}
            />

            {isHallTab && hallFiltering.isFilterPanelOpen ? (
              <ManagementFiltersPanel
                filters={hallFiltering.draftFilters}
                onApply={hallFiltering.applyFilters}
                onChange={hallFiltering.setDraftFilters}
                onClear={hallFiltering.clearFilters}
                typeOptions={hallFiltering.typeOptions}
                validationMessage={hallFiltering.validationMessage}
              />
            ) : null}

            {isBoothTab && boothFiltering.isFilterPanelOpen ? (
              <ManagementBoothFiltersPanel
                filters={boothFiltering.draftFilters}
                onApply={boothFiltering.applyFilters}
                onChange={boothFiltering.setDraftFilters}
                onClear={boothFiltering.clearFilters}
                validationMessage={boothFiltering.validationMessage}
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
          <DataTable
            ariaLabel="Halls and booths"
            columns={hallColumns}
            getItemKey={(hall) => hall.id}
            items={hallFiltering.visibleHalls}
          />
        ) : null}

        {isBoothTab && isBoothsLoading ? (
          <p className="management-page__state">Loading booths...</p>
        ) : null}

        {isBoothTab && !isBoothsLoading && boothsError ? (
          <div className="management-page__state" role="alert">
            <p>{boothsError}</p>
            <button
              type="button"
              onClick={() => void boothFiltering.refetchFilteredBooths()}
            >
              Try again
            </button>
          </div>
        ) : null}

        {isBoothTab && !isBoothsLoading && !boothsError && !hasBooths ? (
          <p className="management-page__state">No booths found.</p>
        ) : null}

        {isBoothTab && !isBoothsLoading && !boothsError && hasBooths ? (
          <DataTable
            actions={boothActions}
            ariaLabel="Booths"
            columns={boothColumns}
            getItemKey={(booth) => booth.id}
            items={boothFiltering.visibleBooths}
          />
        ) : null}

        {isAllTab ? (
          <p className="management-page__state">
            All management items will appear here.
          </p>
        ) : null}
      </section>

      {boothEditing.selectedBooth ? (
        <ManagementBoothEditModal
          booth={boothEditing.selectedBooth}
          error={boothUpdateError}
          isSubmitting={isUpdatingBooth}
          onCancel={boothEditing.closeEditModal}
          onSave={boothEditing.saveBooth}
        />
      ) : null}
    </div>
  );
}
