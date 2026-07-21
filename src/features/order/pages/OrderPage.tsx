import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ApprovedIcon,
  PendingRequestIcon,
  TotalRequestsIcon,
} from "../../../assets/icons/orderIcons";
import {
  Card,
  DataTable,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { AdminLayout } from "../../../layouts";
import {
  BoothRequestDetailsModal,
  getBoothRequestColumns,
  getEventRequestColumns,
  OrderFiltersPanel,
  OrderTabs,
  type OrderTab,
} from "../components";
import {
  useBoothRequestDetails,
  useBoothRequestActions,
  useBoothRequests,
  useBoothRequestStatistics,
  useEventRequests,
} from "../hooks";
import {
  getOrderSummaryStatistics,
  type BoothRequestApiData,
} from "../types";
import "./OrderPage.scss";

type SummaryCard = {
  icon: ReactNode;
  key: "total" | "pending" | "approved";
  label: string;
  value: number | null;
};

export function OrderPage() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<OrderTab>("booth");
  const isBoothTab = activeTab === "booth";
  const isEventTab = activeTab === "event";
  const [searchValue, setSearchValue] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<BoothRequestApiData | null>(null);
  const boothRequestDetails = useBoothRequestDetails(
    selectedRequest?.id ?? null,
  );
  const boothRequests = useBoothRequests();
  const boothRequestStatistics = useBoothRequestStatistics();
  const eventRequests = useEventRequests({
    enabled: isEventTab,
    errorFallback: t.order.eventRequests.table.loadError,
  });
  const refreshAfterRequestAction = useCallback(async () => {
    await Promise.all([
      boothRequestDetails.refetch(),
      boothRequests.refetch(),
      boothRequestStatistics.refetch(),
    ]);
  }, [
    boothRequestDetails.refetch,
    boothRequests.refetch,
    boothRequestStatistics.refetch,
  ]);
  const boothRequestActions = useBoothRequestActions({
    approveConflictFallbackMessage: t.order.approveConflict.loadError,
    approveFallbackMessage: t.order.approveConfirmation.error,
    onApproveSuccess: refreshAfterRequestAction,
    onRejectSuccess: refreshAfterRequestAction,
    rejectFallbackMessage: t.order.rejectConfirmation.error,
  });
  const summaryStatistics = getOrderSummaryStatistics(
    boothRequestStatistics.statistics,
  );
  const columns = useMemo(
    () => getBoothRequestColumns(t, language),
    [language, t],
  );
  const eventColumns = useMemo(
    () => getEventRequestColumns(t, language),
    [language, t],
  );
  const summaryCards: SummaryCard[] = [
    {
      icon: (
        <TotalRequestsIcon
          aria-hidden="true"
          size={22}
          strokeWidth={1.8}
        />
      ),
      key: "total",
      label: t.order.summary.totalRequests,
      value: summaryStatistics.total,
    },
    {
      icon: (
        <PendingRequestIcon
          aria-hidden="true"
          size={22}
          strokeWidth={1.8}
        />
      ),
      key: "pending",
      label: t.order.summary.pendingRequest,
      value: summaryStatistics.pending,
    },
    {
      icon: (
        <ApprovedIcon aria-hidden="true" size={22} strokeWidth={1.8} />
      ),
      key: "approved",
      label: t.order.summary.approved,
      value: summaryStatistics.approved,
    },
  ];
  const closeRequestDetails = useCallback(() => {
    boothRequestActions.closeApproveConflict();
    boothRequestActions.clearApproveError();
    boothRequestActions.clearRejectError();
    setSelectedRequest(null);
  }, [
    boothRequestActions.closeApproveConflict,
    boothRequestActions.clearApproveError,
    boothRequestActions.clearRejectError,
  ]);

  return (
    <AdminLayout>
      <section className="order-page">
        <div className="order-page__container">
          <header className="order-page__header">
            <h1>{t.order.title}</h1>
            <p>{t.order.description}</p>
          </header>

          {isBoothTab ? (
            <div className="order-page__summary">
              {summaryCards.map((summaryCard) => (
                <Card
                  className={`order-page__summary-card order-page__summary-card--${summaryCard.key}`}
                  icon={summaryCard.icon}
                  iconClassName="order-page__summary-icon"
                  key={summaryCard.key}
                  title={summaryCard.label}
                  titleClassName="order-page__summary-label"
                >
                  <strong
                    aria-busy={boothRequestStatistics.isLoading}
                    aria-label={
                      summaryCard.value === null
                        ? boothRequestStatistics.isLoading
                          ? t.order.summary.loading
                          : t.order.summary.unavailable
                        : undefined
                    }
                    aria-live="polite"
                    className="order-page__summary-value"
                  >
                    {summaryCard.value ?? "—"}
                  </strong>
                </Card>
              ))}
            </div>
          ) : null}

          {isBoothTab && boothRequestStatistics.error ? (
            <div className="order-page__state" role="alert">
              <p>
                {boothRequestStatistics.error || t.order.summary.loadError}
              </p>
              <button
                onClick={() => void boothRequestStatistics.refetch()}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          <Card
            aria-label={t.order.panelAriaLabel}
            bodyClassName="order-page__panel-body"
            className="order-page__panel"
          >
            <OrderTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {isBoothTab ? (
              <div
                aria-labelledby="orders-booth-tab"
                className="order-page__tabpanel"
                id="orders-booth-panel"
                role="tabpanel"
              >
                <SearchFilterBar
                  filterAriaLabel={t.order.filters.filterAriaLabel}
                  filterLabel={t.order.filters.filterLabel}
                  inputAriaLabel={t.order.filters.searchAriaLabel}
                  onChange={setSearchValue}
                  onFilterClick={boothRequests.filters.toggleFilterPanel}
                  placeholder={t.order.filters.searchPlaceholder}
                  showFilterButton
                  value={searchValue}
                />

                {boothRequests.filters.isFilterPanelOpen ? (
                  <OrderFiltersPanel
                    filters={boothRequests.filters.draftFilters}
                    onApply={boothRequests.filters.applyFilters}
                    onChange={boothRequests.filters.setDraftFilters}
                    onClear={boothRequests.filters.clearFilters}
                  />
                ) : null}

                {boothRequests.isLoading ? (
                  <p className="order-page__state">
                    {t.order.table.loading}
                  </p>
                ) : null}

                {!boothRequests.isLoading && boothRequests.error ? (
                  <div className="order-page__state" role="alert">
                    <p>{boothRequests.error || t.order.table.loadError}</p>
                    <button
                      type="button"
                      onClick={() => void boothRequests.refetch()}
                    >
                      {t.common.tryAgain}
                    </button>
                  </div>
                ) : null}

                {!boothRequests.isLoading && !boothRequests.error ? (
                  <DataTable
                    ariaLabel={t.order.table.ariaLabel}
                    className="order-page__table"
                    columns={columns}
                    emptyMessage={t.order.table.empty}
                    getItemAriaLabel={(request) =>
                      `${t.order.details.openAriaLabel} ${t.order.table.companyPrefix} #${request.company_id}`
                    }
                    getItemKey={(request) => request.id}
                    items={boothRequests.requests}
                    onItemClick={setSelectedRequest}
                  />
                ) : null}

                {!boothRequests.isLoading &&
                !boothRequests.error &&
                boothRequests.requests.length ? (
                  <TableFooter
                    className="order-page__footer"
                    currentPage={boothRequests.currentPage}
                    onPageChange={boothRequests.setCurrentPage}
                    perPage={boothRequests.perPage}
                    totalItems={boothRequests.totalItems}
                    totalPages={boothRequests.totalPages}
                  />
                ) : null}
              </div>
            ) : null}

            {isEventTab ? (
              <div
                aria-labelledby="orders-event-tab"
                className="order-page__tabpanel"
                id="orders-event-panel"
                role="tabpanel"
              >
                <SearchFilterBar
                  filterAriaLabel={
                    t.order.eventRequests.filters.filterAriaLabel
                  }
                  filterLabel={t.order.filters.filterLabel}
                  inputAriaLabel={
                    t.order.eventRequests.filters.searchAriaLabel
                  }
                  onChange={eventRequests.setSearchValue}
                  onFilterClick={eventRequests.filters.toggleFilterPanel}
                  placeholder={
                    t.order.eventRequests.filters.searchPlaceholder
                  }
                  showFilterButton
                  value={eventRequests.searchValue}
                />

                {eventRequests.filters.isFilterPanelOpen ? (
                  <OrderFiltersPanel
                    ariaLabel={
                      t.order.eventRequests.filters.panelAriaLabel
                    }
                    filters={eventRequests.filters.draftFilters}
                    onApply={eventRequests.filters.applyFilters}
                    onChange={eventRequests.filters.setDraftFilters}
                    onClear={eventRequests.filters.clearFilters}
                  />
                ) : null}

                {eventRequests.isLoading ? (
                  <p className="order-page__state">
                    {t.order.eventRequests.table.loading}
                  </p>
                ) : null}

                {!eventRequests.isLoading && eventRequests.error ? (
                  <div className="order-page__state" role="alert">
                    <p>
                      {eventRequests.error ||
                        t.order.eventRequests.table.loadError}
                    </p>
                    <button
                      onClick={() => void eventRequests.refetch()}
                      type="button"
                    >
                      {t.common.tryAgain}
                    </button>
                  </div>
                ) : null}

                {!eventRequests.isLoading && !eventRequests.error ? (
                  <DataTable
                    ariaLabel={t.order.eventRequests.table.ariaLabel}
                    className="order-page__table event-request-table"
                    columns={eventColumns}
                    emptyMessage={t.order.eventRequests.table.empty}
                    getItemKey={(request) => request.id}
                    items={eventRequests.requests}
                  />
                ) : null}

                {!eventRequests.isLoading &&
                !eventRequests.error &&
                eventRequests.requests.length ? (
                  <TableFooter
                    className="order-page__footer"
                    currentPage={eventRequests.currentPage}
                    onPageChange={eventRequests.setCurrentPage}
                    perPage={eventRequests.perPage}
                    showSinglePage
                    totalItems={eventRequests.totalItems}
                    totalPages={eventRequests.totalPages}
                  />
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      {selectedRequest ? (
        <BoothRequestDetailsModal
          approveConflict={boothRequestActions.approveConflict}
          approveConflictError={boothRequestActions.approveConflictError}
          approveError={boothRequestActions.approveError}
          details={boothRequestDetails.details}
          error={boothRequestDetails.error}
          isApproving={boothRequestActions.isApproving}
          isLoading={boothRequestDetails.isLoading}
          isLoadingApproveConflicts={
            boothRequestActions.isLoadingApproveConflicts
          }
          isRejecting={boothRequestActions.isRejecting}
          onApprove={boothRequestActions.approveBoothRequestById}
          onApproveAnyway={boothRequestActions.approveBoothRequestAnyway}
          onApproveConflictPageChange={
            boothRequestActions.loadApproveConflictPage
          }
          onClearApproveError={boothRequestActions.clearApproveError}
          onClearRejectError={boothRequestActions.clearRejectError}
          onClose={closeRequestDetails}
          onCloseApproveConflict={boothRequestActions.closeApproveConflict}
          onReject={boothRequestActions.rejectBoothRequestById}
          onRetry={() => void boothRequestDetails.refetch()}
          rejectError={boothRequestActions.rejectError}
        />
      ) : null}
    </AdminLayout>
  );
}
