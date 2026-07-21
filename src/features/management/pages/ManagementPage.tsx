import { useCallback, useMemo, useState } from "react";
import {
  DataTable,
  filterBySearchQuery,
  SearchFilterBar,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import { ManagementBoothEditModal } from "../components/ManagementBoothEditModal";
import { ManagementBoothFiltersPanel } from "../components/ManagementBoothFiltersPanel";
import { ManagementEventHallDetailsModal } from "../components/ManagementEventHallDetailsModal";
import { ManagementEventHallEditModal } from "../components/ManagementEventHallEditModal";
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
  useEventHallDetails,
  useEventHallEditing,
  useEventHalls,
  useHallFiltering,
  useHalls,
} from "../hooks";
import {
  getBoothColumns,
  getBoothActions,
  getEventHallColumns,
  getEventHallActions,
  getHallColumns,
} from "../components/tableColumns";
import type { UpdateEventHallPricePayload } from "../types";
import "./ManagementPage.scss";

export function ManagementPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ManagementTab>("hall");
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
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
  const eventHallFiltering = useEventHalls({
    enabled: isEventHallTab,
    errorFallback: t.management.eventHalls.errorFallback,
    updateErrorFallback: t.management.eventHalls.updateErrorFallback,
    validationMessages: t.management.validation,
  });
  const eventHallDetails = useEventHallDetails({
    errorFallback: t.management.eventHalls.details.errorFallback,
  });
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
  const updateEventHallPriceForEditing = useCallback(
    async (
      eventHallId: number,
      payload: UpdateEventHallPricePayload,
    ) => {
      const updatedEventHall =
        await eventHallFiltering.updateEventHallPriceById(
          eventHallId,
          payload,
        );

      if (
        updatedEventHall &&
        eventHallDetails.isOpen &&
        eventHallDetails.selectedEventHallId === eventHallId
      ) {
        void eventHallDetails.retry();
      }

      return updatedEventHall;
    },
    [
      eventHallDetails.isOpen,
      eventHallDetails.retry,
      eventHallDetails.selectedEventHallId,
      eventHallFiltering.updateEventHallPriceById,
    ],
  );
  const eventHallEditing = useEventHallEditing({
    clearUpdateError: eventHallFiltering.clearUpdateError,
    updateEventHallPriceById: updateEventHallPriceForEditing,
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
  const eventHallActions = useMemo(() => {
    return getEventHallActions(
      eventHallEditing.openEditModal,
      t.common.edit,
    );
  }, [eventHallEditing.openEditModal, t.common.edit]);
  const hasHalls = hallFiltering.visibleHalls.length > 0;
  const hasBooths = boothFiltering.visibleBooths.length > 0;

  const visibleEventHalls = useMemo(() => {
    return filterBySearchQuery(
      eventHallFiltering.eventHalls,
      searchValue,
      (eventHall) => [
        eventHall.id,
        eventHall.number,
        eventHall.area,
        eventHall.price_per_hour,
      ],
    );
  }, [eventHallFiltering.eventHalls, searchValue]);

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
    eventHallFiltering.closeFilterPanel();
    eventHallDetails.closeDetails();
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
                      : eventHallFiltering.toggleFilterPanel
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

              {isEventHallTab && eventHallFiltering.isFilterPanelOpen ? (
                <ManagementBoothFiltersPanel
                  filters={eventHallFiltering.draftFilters}
                  mode="eventHall"
                  onApply={eventHallFiltering.applyFilters}
                  onChange={eventHallFiltering.setDraftFilters}
                  onClear={eventHallFiltering.clearFilters}
                  validationMessage={eventHallFiltering.validationMessage}
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

          {isEventHallTab && eventHallFiltering.isLoading ? (
            <p className="management-page__state">
              {t.management.eventHalls.loading}
            </p>
          ) : null}

          {isEventHallTab &&
          !eventHallFiltering.isLoading &&
          eventHallFiltering.error ? (
            <div className="management-page__state" role="alert">
              <p>
                {eventHallFiltering.error ||
                  t.management.eventHalls.errorFallback}
              </p>
              <button
                type="button"
                onClick={() => void eventHallFiltering.refetch()}
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {isEventHallTab &&
          !eventHallFiltering.isLoading &&
          !eventHallFiltering.error ? (
            <DataTable
              actions={eventHallActions}
              ariaLabel={t.management.eventHalls.ariaLabel}
              columns={eventHallColumns}
              emptyMessage={t.management.eventHalls.empty}
              getItemAriaLabel={(eventHall) =>
                `${t.management.eventHalls.details.openAriaLabel} #${eventHall.id}`
              }
              getItemKey={(eventHall) => eventHall.id}
              items={visibleEventHalls}
              onItemClick={(eventHall) =>
                eventHallDetails.openDetails(eventHall.id)
              }
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

        {eventHallEditing.selectedEventHall ? (
          <ManagementEventHallEditModal
            error={eventHallFiltering.updateError}
            eventHall={eventHallEditing.selectedEventHall}
            isSubmitting={eventHallFiltering.isUpdating}
            onCancel={eventHallEditing.closeEditModal}
            onSave={eventHallEditing.saveEventHallPrice}
          />
        ) : null}

        {eventHallDetails.isOpen &&
        eventHallDetails.selectedEventHallId !== null ? (
          <ManagementEventHallDetailsModal
            details={eventHallDetails.eventHallDetails}
            error={eventHallDetails.error}
            eventHallId={eventHallDetails.selectedEventHallId}
            isLoading={eventHallDetails.isLoading}
            onClose={eventHallDetails.closeDetails}
            onRetry={() => void eventHallDetails.retry()}
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
