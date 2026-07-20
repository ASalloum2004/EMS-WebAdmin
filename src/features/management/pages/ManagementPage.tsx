import { useMemo, useState } from "react";
import {
  DataTable,
  filterBySearchQuery,
  SearchFilterBar,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import { ManagementBoothEditModal } from "../components/ManagementBoothEditModal";
import { ManagementBoothFiltersPanel } from "../components/ManagementBoothFiltersPanel";
import { ManagementFiltersPanel } from "../components/ManagementFiltersPanel";
import { ManagementHeader } from "../components/ManagementHeader";
import { ManagementServicesModal } from "../components/ManagementServicesModal";
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
  getEventHallColumns,
  getHallColumns,
} from "../components/tableColumns";
import type { EventHall, EventHallClientFilters } from "../types";
import "./ManagementPage.scss";

const EVENT_HALLS: EventHall[] = [
  { id: 1, number: "1", area: 100, price_per_hour: "50000.00" },
  { id: 2, number: "2", area: 150, price_per_hour: "75000.00" },
  { id: 3, number: "3", area: 100, price_per_hour: "50000.00" },
  { id: 4, number: "4", area: 200, price_per_hour: "100000.00" },
];

function createEmptyEventHallFilters(): EventHallClientFilters {
  return {
    maxArea: "",
    maxPrice: "",
    minArea: "",
    minPrice: "",
  };
}

function getOptionalNumber(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const numericValue = Number(trimmedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function ManagementPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ManagementTab>("hall");
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [eventHallFilters, setEventHallFilters] =
    useState<EventHallClientFilters>(createEmptyEventHallFilters);
  const [eventHallDraftFilters, setEventHallDraftFilters] =
    useState<EventHallClientFilters>(createEmptyEventHallFilters);
  const [isEventHallFilterPanelOpen, setIsEventHallFilterPanelOpen] =
    useState(false);
  const isHallTab = activeTab === "hall";
  const isBoothTab = activeTab === "booth";
  const isEventHallTab = activeTab === "eventHall";
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
  const eventHallColumns = useMemo(() => {
    return getEventHallColumns(t);
  }, [t]);
  const boothActions = useMemo(() => {
    return getBoothActions(boothEditing.openEditModal, t.common.edit);
  }, [boothEditing.openEditModal, t.common.edit]);
  const hasHalls = hallFiltering.visibleHalls.length > 0;
  const hasBooths = boothFiltering.visibleBooths.length > 0;

  const eventHallValidationMessage = useMemo(() => {
    const minArea = getOptionalNumber(eventHallDraftFilters.minArea);
    const maxArea = getOptionalNumber(eventHallDraftFilters.maxArea);
    const minPrice = getOptionalNumber(eventHallDraftFilters.minPrice);
    const maxPrice = getOptionalNumber(eventHallDraftFilters.maxPrice);

    if (
      eventHallDraftFilters.minArea.trim() &&
      minArea === null
    ) {
      return t.management.validation.invalidMinimumArea;
    }

    if (
      eventHallDraftFilters.maxArea.trim() &&
      maxArea === null
    ) {
      return t.management.validation.invalidMaximumArea;
    }

    if (
      eventHallDraftFilters.minPrice.trim() &&
      minPrice === null
    ) {
      return t.management.validation.invalidMinimumPrice;
    }

    if (
      eventHallDraftFilters.maxPrice.trim() &&
      maxPrice === null
    ) {
      return t.management.validation.invalidMaximumPrice;
    }

    if (minArea !== null && maxArea !== null && minArea > maxArea) {
      return t.management.validation.minimumAreaGreaterThanMaximum;
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return t.management.validation.minimumPriceGreaterThanMaximum;
    }

    return "";
  }, [eventHallDraftFilters, t]);

  const visibleEventHalls = useMemo(() => {
    const minArea = getOptionalNumber(eventHallFilters.minArea);
    const maxArea = getOptionalNumber(eventHallFilters.maxArea);
    const minPrice = getOptionalNumber(eventHallFilters.minPrice);
    const maxPrice = getOptionalNumber(eventHallFilters.maxPrice);
    const filteredEventHalls = EVENT_HALLS.filter((eventHall) => {
      const pricePerHour = Number(eventHall.price_per_hour);

      return !(
        (minArea !== null && eventHall.area < minArea) ||
        (maxArea !== null && eventHall.area > maxArea) ||
        (minPrice !== null && pricePerHour < minPrice) ||
        (maxPrice !== null && pricePerHour > maxPrice)
      );
    });

    return filterBySearchQuery(
      filteredEventHalls,
      searchValue,
      (eventHall) => [
        eventHall.id,
        eventHall.number,
        eventHall.area,
        eventHall.price_per_hour,
      ],
    );
  }, [eventHallFilters, searchValue]);

  const searchPlaceholder = isBoothTab
    ? t.management.search.boothsPlaceholder
    : isHallTab
      ? t.management.search.hallsPlaceholder
      : t.management.search.eventHallsPlaceholder;
  const searchAriaLabel = isBoothTab
    ? t.management.search.boothsAriaLabel
    : isHallTab
      ? t.management.search.hallsAriaLabel
      : t.management.search.eventHallsAriaLabel;

  function handleTabChange(tab: ManagementTab) {
    setActiveTab(tab);
    hallFiltering.closeFilterPanel();
    boothFiltering.closeFilterPanel();
    setIsEventHallFilterPanelOpen(false);
  }

  function toggleEventHallFilterPanel() {
    if (!isEventHallFilterPanelOpen) {
      setEventHallDraftFilters(eventHallFilters);
    }

    setIsEventHallFilterPanelOpen((isOpen) => !isOpen);
  }

  function applyEventHallFilters() {
    if (eventHallValidationMessage) {
      return;
    }

    setEventHallFilters(eventHallDraftFilters);
    setIsEventHallFilterPanelOpen(false);
  }

  function clearEventHallFilters() {
    const emptyFilters = createEmptyEventHallFilters();

    setEventHallDraftFilters(emptyFilters);
    setEventHallFilters(emptyFilters);
  }

  return (
    <ManagementLayout>
      <div className="management-page">
        <ManagementHeader
          title={t.management.title}
          description={t.management.description}
          actionLabel={t.management.services}
          onActionClick={() => setIsServicesModalOpen(true)}
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
                      : toggleEventHallFilterPanel
                }
                placeholder={searchPlaceholder}
                showFilterButton
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

              {isEventHallTab && isEventHallFilterPanelOpen ? (
                <ManagementBoothFiltersPanel
                  filters={eventHallDraftFilters}
                  mode="eventHall"
                  onApply={applyEventHallFilters}
                  onChange={setEventHallDraftFilters}
                  onClear={clearEventHallFilters}
                  validationMessage={eventHallValidationMessage}
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
              className="management-booth-table"
              columns={boothColumns}
              getItemKey={(booth) => booth.id}
              items={boothFiltering.visibleBooths}
            />
          ) : null}

          {isEventHallTab ? (
            <DataTable
              ariaLabel={t.management.eventHalls.ariaLabel}
              columns={eventHallColumns}
              emptyMessage={t.management.eventHalls.empty}
              getItemKey={(eventHall) => eventHall.id}
              items={visibleEventHalls}
            />
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

        {isServicesModalOpen ? (
          <ManagementServicesModal
            onClose={() => setIsServicesModalOpen(false)}
          />
        ) : null}
      </div>
    </ManagementLayout>
  );
}
