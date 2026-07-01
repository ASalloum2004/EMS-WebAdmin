import { useMemo, useState } from "react";
import { DataTable, SearchFilterBar } from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
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
  getBoothColumns,
  getBoothActions,
  getHallColumns,
} from "../components/tableColumns";
import "./ManagementPage.scss";

export function ManagementPage() {
  const { t } = useI18n();
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
  const hallFiltering = useHallFiltering({
    halls,
    searchValue,
    validationMessages: t.management.validation,
  });
  const boothEditing = useBoothEditing({
    clearUpdateError,
    updateBoothById,
  });
  const boothFiltering = useBoothFiltering({
    booths,
    refetchBooths,
    searchValue,
    validationMessages: t.management.validation,
  });
  const hallColumns = useMemo(() => {
    return getHallColumns(t);
  }, [t]);
  const boothColumns = useMemo(() => {
    return getBoothColumns(t);
  }, [t]);
  const boothActions = useMemo(() => {
    return getBoothActions(boothEditing.openEditModal, t.common.edit);
  }, [boothEditing.openEditModal, t.common.edit]);
  const hasHalls = hallFiltering.visibleHalls.length > 0;
  const hasBooths = boothFiltering.visibleBooths.length > 0;

  const searchPlaceholder = isBoothTab
    ? t.management.search.boothsPlaceholder
    : isHallTab
      ? t.management.search.hallsPlaceholder
      : t.management.search.managementPlaceholder;
  const searchAriaLabel = isBoothTab
    ? t.management.search.boothsAriaLabel
    : isHallTab
      ? t.management.search.hallsAriaLabel
      : t.management.search.managementAriaLabel;

  function handleTabChange(tab: ManagementTab) {
    setActiveTab(tab);
    hallFiltering.closeFilterPanel();
    boothFiltering.closeFilterPanel();
  }

  return (
    <ManagementLayout>
      <div className="management-page">
        <ManagementHeader
          title={t.management.title}
          description={t.management.description}
          actionLabel={t.management.services}
        />

        <section
          className="management-page__panel"
          aria-label={t.management.search.managementAriaLabel}
        >
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
                filterAriaLabel={t.common.openFilters}
                filterLabel={t.common.filter}
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
            <p className="management-page__state">
              {t.management.halls.loading}
            </p>
          ) : null}

          {isHallTab && !isHallsLoading && hallsError ? (
            <div className="management-page__state" role="alert">
              <p>{hallsError || t.management.halls.errorFallback}</p>
              <button type="button" onClick={() => void refetchHalls()}>
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {isHallTab && !isHallsLoading && !hallsError && !hasHalls ? (
            <p className="management-page__state">{t.management.halls.empty}</p>
          ) : null}

          {isHallTab && !isHallsLoading && !hallsError && hasHalls ? (
            <DataTable
              ariaLabel={t.management.halls.ariaLabel}
              columns={hallColumns}
              getItemKey={(hall) => hall.id}
              items={hallFiltering.visibleHalls}
            />
          ) : null}

          {isBoothTab && isBoothsLoading ? (
            <p className="management-page__state">
              {t.management.booths.loading}
            </p>
          ) : null}

          {isBoothTab && !isBoothsLoading && boothsError ? (
            <div className="management-page__state" role="alert">
              <p>{boothsError || t.management.booths.errorFallback}</p>
              <button
                type="button"
                onClick={() => void boothFiltering.refetchFilteredBooths()}
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {isBoothTab && !isBoothsLoading && !boothsError && !hasBooths ? (
            <p className="management-page__state">
              {t.management.booths.empty}
            </p>
          ) : null}

          {isBoothTab && !isBoothsLoading && !boothsError && hasBooths ? (
            <DataTable
              actions={boothActions}
              ariaLabel={t.management.booths.ariaLabel}
              columns={boothColumns}
              getItemKey={(booth) => booth.id}
              items={boothFiltering.visibleBooths}
            />
          ) : null}

          {isAllTab ? (
            <p className="management-page__state">
              {t.management.allItemsPlaceholder}
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
    </ManagementLayout>
  );
}
