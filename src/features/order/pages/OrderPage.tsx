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
  OrderFiltersPanel,
} from "../components";
import { getOrderSummaryStatistics } from "../data";
import {
  useBoothRequestDetails,
  useBoothRequests,
  useBoothRequestStatistics,
} from "../hooks";
import type { BoothRequestApiData } from "../types";
import "./OrderPage.scss";

type SummaryCard = {
  icon: ReactNode;
  key: "total" | "pending" | "approved";
  label: string;
  value: number | null;
};

export function OrderPage() {
  const { language, t } = useI18n();
  const [searchValue, setSearchValue] = useState("");
  const [selectedRequest, setSelectedRequest] =
    useState<BoothRequestApiData | null>(null);
  const boothRequestDetails = useBoothRequestDetails(
    selectedRequest?.id ?? null,
  );
  const boothRequests = useBoothRequests();
  const boothRequestStatistics = useBoothRequestStatistics();
  const summaryStatistics = getOrderSummaryStatistics(
    boothRequestStatistics.statistics,
  );
  const columns = useMemo(
    () => getBoothRequestColumns(t, language),
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
    setSelectedRequest(null);
  }, []);

  return (
    <AdminLayout>
      <section className="order-page">
        <div className="order-page__container">
          <header className="order-page__header">
            <h1>{t.order.title}</h1>
            <p>{t.order.description}</p>
          </header>

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

          {boothRequestStatistics.error ? (
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
              <p className="order-page__state">{t.order.table.loading}</p>
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
          </Card>
        </div>
      </section>

      {selectedRequest ? (
        <BoothRequestDetailsModal
          details={boothRequestDetails.details}
          error={boothRequestDetails.error}
          isLoading={boothRequestDetails.isLoading}
          onClose={closeRequestDetails}
          onRetry={() => void boothRequestDetails.refetch()}
        />
      ) : null}
    </AdminLayout>
  );
}
