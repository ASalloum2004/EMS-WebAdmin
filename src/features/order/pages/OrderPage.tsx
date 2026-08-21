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
  BoothRequestListSkeleton,
  EventRequestDetailsModal,
  EventRequestListSkeleton,
  OrderStatsSkeleton,
  getBoothRequestCompanyDisplayName,
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
  useEventRequestActions,
  useEventRequestDetails,
  useEventRequests,
  useEventRequestStatistics,
  usePaymentReminder,
} from "../hooks";
import {
  getEventRequestSummaryStatistics,
  getOrderSummaryStatistics,
} from "../types";
import "./OrderPage.scss";

type SummaryCard = {
  icon: ReactNode;
  key: "total" | "pending" | "approved";
  label: string;
  value: number | null;
};

type OrderDetailsTarget = {
  id: number;
  tab: OrderTab;
};

function getPositiveIntegerSearchParam(searchParam: string | null) {
  if (!searchParam || !/^\d+$/.test(searchParam)) {
    return null;
  }

  const parsedValue = Number(searchParam);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

function getOrderDetailsTargetFromSearch(): OrderDetailsTarget | null {
  const searchParams = new URLSearchParams(window.location.search);
  const tab = searchParams.get("tab");

  if (tab === "booth") {
    const id = getPositiveIntegerSearchParam(
      searchParams.get("boothRequestId"),
    );

    return id === null ? null : { id, tab };
  }

  if (tab === "event") {
    const id = getPositiveIntegerSearchParam(
      searchParams.get("eventRequestId"),
    );

    return id === null ? null : { id, tab };
  }

  return null;
}

function clearOrderDetailsSearch() {
  const searchParams = new URLSearchParams(window.location.search);
  const detailSearchParams = ["tab", "boothRequestId", "eventRequestId"];
  const hasDetailsSearch = detailSearchParams.some((searchParam) =>
    searchParams.has(searchParam),
  );

  if (!hasDetailsSearch) {
    return;
  }

  detailSearchParams.forEach((searchParam) => searchParams.delete(searchParam));
  const search = searchParams.toString();

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
  );
}

export function OrderPage() {
  const { language, t } = useI18n();
  const [initialDetailsTarget] = useState(getOrderDetailsTargetFromSearch);
  const [activeTab, setActiveTab] = useState<OrderTab>(
    initialDetailsTarget?.tab ?? "booth",
  );
  const isBoothTab = activeTab === "booth";
  const isEventTab = activeTab === "event";
  const [selectedBoothRequestId, setSelectedBoothRequestId] = useState<
    number | null
  >(initialDetailsTarget?.tab === "booth" ? initialDetailsTarget.id : null);
  const [selectedEventRequestId, setSelectedEventRequestId] = useState<
    number | null
  >(initialDetailsTarget?.tab === "event" ? initialDetailsTarget.id : null);
  const boothRequestDetails = useBoothRequestDetails(
    selectedBoothRequestId,
  );
  const boothRequests = useBoothRequests();
  const boothRequestStatistics = useBoothRequestStatistics();
  const eventRequests = useEventRequests({
    enabled: isEventTab,
    errorFallback: t.order.eventRequests.table.loadError,
  });
  const eventRequestStatistics = useEventRequestStatistics({
    enabled: isEventTab,
    errorFallback: t.order.eventRequests.summary.loadError,
  });
  const eventRequestDetails = useEventRequestDetails(
    selectedEventRequestId,
    t.order.eventRequests.details.loadError,
  );
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
    onCancelSuccess: refreshAfterRequestAction,
    rejectFallbackMessage: t.order.rejectConfirmation.error,

  });
  const refreshAfterEventRequestAction = useCallback(async () => {
    await Promise.all([
      eventRequestDetails.refetch(),
      eventRequests.refetch(),
      eventRequestStatistics.refetch(),
    ]);
  }, [
    eventRequestDetails.refetch,
    eventRequests.refetch,
    eventRequestStatistics.refetch,
  ]);
  const boothPaymentReminder = usePaymentReminder({
    fallbackMessage: t.order.paymentReminder.error,
    requestId: selectedBoothRequestId,
    requestKind: "booth",
    requestStatus: boothRequestDetails.details?.status,
  });
  const eventPaymentReminder = usePaymentReminder({
    fallbackMessage: t.order.paymentReminder.error,
    requestId: selectedEventRequestId,
    requestKind: "event",
    requestStatus: eventRequestDetails.details?.status,
  });
  const eventRequestActions = useEventRequestActions({
    approveConflictFallbackMessage:
      t.order.eventRequests.approveConflict.loadError,
    approveFallbackMessage: t.order.eventRequests.approveConfirmation.error,
    invalidStatusMessage: t.order.eventRequests.actions.invalidStatus,
    onApproveSuccess: refreshAfterEventRequestAction,
        onInvalidStatus: refreshAfterEventRequestAction,
    onRejectSuccess: refreshAfterEventRequestAction,
    onCancelSuccess: refreshAfterEventRequestAction,
    rejectFallbackMessage: t.order.eventRequests.rejectConfirmation.error,

    selectedRequestId: selectedEventRequestId,
    selectedRequestStatus: eventRequestDetails.details?.status ?? null,
  });
  const summaryStatistics = getOrderSummaryStatistics(
    boothRequestStatistics.statistics,
  );
  const eventSummaryStatistics = getEventRequestSummaryStatistics(
    eventRequestStatistics.statistics,
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
  const eventSummaryCards: SummaryCard[] = [
    {
      icon: (
        <TotalRequestsIcon
          aria-hidden="true"
          size={22}
          strokeWidth={1.8}
        />
      ),
      key: "total",
      label: t.order.eventRequests.summary.totalRequests,
      value: eventSummaryStatistics.total,
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
      label: t.order.eventRequests.summary.pendingRequest,
      value: eventSummaryStatistics.pending,
    },
    {
      icon: (
        <ApprovedIcon aria-hidden="true" size={22} strokeWidth={1.8} />
      ),
      key: "approved",
      label: t.order.eventRequests.summary.approved,
      value: eventSummaryStatistics.approved,
    },
  ];
  const isBoothRequestListLoading =
    boothRequests.isLoading || boothRequests.isRefreshing;
  const isEventRequestListLoading =
    eventRequests.isLoading || eventRequests.isRefreshing;
  const closeRequestDetails = useCallback(() => {
    boothRequestActions.closeApproveConflict();
    boothRequestActions.clearApproveError();
    boothRequestActions.clearRejectError();
    clearOrderDetailsSearch();
    setSelectedBoothRequestId(null);
  }, [
    boothRequestActions.closeApproveConflict,
    boothRequestActions.clearApproveError,
    boothRequestActions.clearRejectError,
  ]);
  const closeEventRequestDetails = useCallback(() => {
    eventRequestActions.clearApproveError();
    eventRequestActions.clearRejectError();
    eventRequestActions.closeApproveConflict();
    clearOrderDetailsSearch();
    setSelectedEventRequestId(null);
  }, [
    eventRequestActions.clearApproveError,
    eventRequestActions.clearRejectError,
    eventRequestActions.closeApproveConflict,
  ]);

  return (
    <AdminLayout>
      <section className="order-page">
        <div className="order-page__container">
          <header className="order-page__header">
            <h1>{t.order.title}</h1>
            <p>{t.order.description}</p>
          </header>

          {isBoothTab && boothRequestStatistics.isLoading ? (
            <OrderStatsSkeleton />
          ) : isBoothTab ? (
            <div
              aria-busy={boothRequestStatistics.isRefreshing}
              className="order-page__summary"
            >
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
                    aria-label={
                      summaryCard.value === null
                        ? t.order.summary.unavailable
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

          {isEventTab && eventRequestStatistics.error ? (
            <div className="order-page__state" role="alert">
              <p>
                {eventRequestStatistics.error ||
                  t.order.eventRequests.summary.loadError}
              </p>
              <button
                onClick={() => void eventRequestStatistics.refetch()}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : isEventTab && eventRequestStatistics.isLoading ? (
            <OrderStatsSkeleton
              loadingMessage={t.order.eventRequests.summary.loading}
            />
          ) : isEventTab ? (
            <div
              aria-busy={eventRequestStatistics.isRefreshing}
              className="order-page__summary"
            >
              {eventSummaryCards.map((summaryCard) => (
                <Card
                  className={`order-page__summary-card order-page__summary-card--${summaryCard.key}`}
                  icon={summaryCard.icon}
                  iconClassName="order-page__summary-icon"
                  key={summaryCard.key}
                  title={summaryCard.label}
                  titleClassName="order-page__summary-label"
                >
                  <strong
                    aria-label={
                      summaryCard.value === null
                        ? t.order.eventRequests.summary.unavailable
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
                aria-busy={
                  isBoothRequestListLoading
                }
                aria-labelledby="orders-booth-tab"
                className="order-page__tabpanel"
                id="orders-booth-panel"
                role="tabpanel"
              >
                <SearchFilterBar
                  filterAriaLabel={t.order.filters.filterAriaLabel}
                  filterLabel={t.order.filters.filterLabel}
                  inputAriaLabel={t.order.filters.companySearchAriaLabel}
                  onChange={boothRequests.setSearchValue}
                  onFilterClick={boothRequests.filters.toggleFilterPanel}
                  placeholder={t.order.filters.companySearchPlaceholder}
                  showFilterButton
                  value={boothRequests.searchValue}
                />

                {boothRequests.filters.isFilterPanelOpen ? (
                  <OrderFiltersPanel
                    filters={boothRequests.filters.draftFilters}
                    onApply={boothRequests.filters.applyFilters}
                    onChange={boothRequests.filters.setDraftFilters}
                    onClear={boothRequests.filters.clearFilters}
                  />
                ) : null}

                {isBoothRequestListLoading ? (
                  <BoothRequestListSkeleton />
                ) : null}

                {!isBoothRequestListLoading && boothRequests.error ? (
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

                {!isBoothRequestListLoading &&
                (!boothRequests.error || boothRequests.requests.length) ? (
                  <DataTable
                    ariaLabel={t.order.table.ariaLabel}
                    className="order-page__table"
                    columns={columns}
                    emptyMessage={t.order.table.empty}
                    getItemAriaLabel={(request) =>
                      `${t.order.details.openAriaLabel} ${getBoothRequestCompanyDisplayName(request, t)}`
                    }
                    getItemKey={(request) => request.id}
                    items={boothRequests.requests}
                    onItemClick={(request) =>
                      setSelectedBoothRequestId(request.id)
                    }
                  />
                ) : null}

                {!isBoothRequestListLoading &&
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
                aria-busy={
                  isEventRequestListLoading
                }
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

                {isEventRequestListLoading ? (
                  <EventRequestListSkeleton />
                ) : null}

                {!isEventRequestListLoading && eventRequests.error ? (
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

                {!isEventRequestListLoading &&
                (!eventRequests.error || eventRequests.requests.length) ? (
                  <DataTable
                    ariaLabel={t.order.eventRequests.table.ariaLabel}
                    className="order-page__table event-request-table"
                    columns={eventColumns}
                    emptyMessage={t.order.eventRequests.table.empty}
                    getItemAriaLabel={(request) =>
                      `${t.order.eventRequests.details.openAriaLabel} ${request.title}`
                    }
                    getItemKey={(request) => request.id}
                    items={eventRequests.requests}
                    onItemClick={(request) =>
                      setSelectedEventRequestId(request.id)
                    }
                  />
                ) : null}

                {!isEventRequestListLoading &&
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

      {selectedBoothRequestId !== null ? (
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
          isCancelling={boothRequestActions.isCancelling}
          isSendingPaymentReminder={boothPaymentReminder.isSending}
          onClearPaymentReminderError={boothPaymentReminder.clearError}
          onSendPaymentReminder={boothPaymentReminder.send}
          onApprove={boothRequestActions.approveBoothRequestById}
          onApproveAnyway={boothRequestActions.approveBoothRequestAnyway}
          onApproveConflictPageChange={
            boothRequestActions.loadApproveConflictPage
          }
          onClearApproveError={boothRequestActions.clearApproveError}
          onClearRejectError={boothRequestActions.clearRejectError}
          onCancel={boothRequestActions.cancelBoothRequestById}
          onClearCancelError={boothRequestActions.clearCancelError}
          onClose={closeRequestDetails}
          onCloseApproveConflict={boothRequestActions.closeApproveConflict}
          onReject={boothRequestActions.rejectBoothRequestById}
          onRetry={() => void boothRequestDetails.refetch()}
          paymentReminderError={boothPaymentReminder.error}
          paymentReminderSuccessMessage={boothPaymentReminder.successMessage}
          rejectError={boothRequestActions.rejectError}
          cancelError={boothRequestActions.cancelError}
        />
      ) : null}

      {selectedEventRequestId !== null ? (
        <EventRequestDetailsModal
          approveConflict={eventRequestActions.approveConflict}
          approveConflictError={eventRequestActions.approveConflictError}
          approveError={eventRequestActions.approveError}
          details={eventRequestDetails.details}
          error={eventRequestDetails.error}
          isApproving={eventRequestActions.isApproving}
          isLoading={eventRequestDetails.isLoading}
          isLoadingApproveConflicts={
            eventRequestActions.isLoadingApproveConflicts
          }
          isRejecting={eventRequestActions.isRejecting}
          isCancelling={eventRequestActions.isCancelling}
          isSendingPaymentReminder={eventPaymentReminder.isSending}
          onClearPaymentReminderError={eventPaymentReminder.clearError}
          onSendPaymentReminder={eventPaymentReminder.send}
          onApprove={eventRequestActions.approveEventRequestById}
          onApproveAnyway={eventRequestActions.approveEventRequestAnyway}
          onApproveConflictPageChange={
            eventRequestActions.loadApproveConflictPage
          }
          onClearApproveError={eventRequestActions.clearApproveError}
          onClearRejectError={eventRequestActions.clearRejectError}
          onCancel={eventRequestActions.cancelEventRequestById}
          onClearCancelError={eventRequestActions.clearCancelError}
          onClose={closeEventRequestDetails}
          onCloseApproveConflict={eventRequestActions.closeApproveConflict}
          onReject={eventRequestActions.rejectEventRequestById}
          onRetry={() => void eventRequestDetails.refetch()}
          paymentReminderError={eventPaymentReminder.error}
          paymentReminderSuccessMessage={eventPaymentReminder.successMessage}
          rejectError={eventRequestActions.rejectError}
          cancelError={eventRequestActions.cancelError}
        />
      ) : null}
    </AdminLayout>
  );
}
