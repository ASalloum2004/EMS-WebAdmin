import { useMemo, type ReactNode } from "react";
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
  getBoothRequestColumns,
  OrderFiltersPanel,
} from "../components";
import { orderSummaryPresentationData } from "../data";
import { useBoothRequests } from "../hooks";
import "./OrderPage.scss";

type SummaryCard = {
  icon: ReactNode;
  key: "total" | "pending" | "approved";
  label: string;
  value: number;
};

export function OrderPage() {
  const { language, t } = useI18n();
  const boothRequests = useBoothRequests();
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
      value: boothRequests.totalItems,
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
      value: orderSummaryPresentationData.pendingRequests,
    },
    {
      icon: (
        <ApprovedIcon aria-hidden="true" size={22} strokeWidth={1.8} />
      ),
      key: "approved",
      label: t.order.summary.approved,
      value: orderSummaryPresentationData.approvedRequests,
    },
  ];

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
                <strong className="order-page__summary-value">
                  {summaryCard.value}
                </strong>
              </Card>
            ))}
          </div>

          <Card
            aria-label={t.order.panelAriaLabel}
            bodyClassName="order-page__panel-body"
            className="order-page__panel"
          >
            <SearchFilterBar
              filterAriaLabel={t.order.filters.filterAriaLabel}
              filterLabel={t.order.filters.filterLabel}
              onFilterClick={boothRequests.filters.toggleFilterPanel}
              showFilterButton
              showSearch={false}
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
                getItemKey={(request) => request.id}
                items={boothRequests.requests}
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
    </AdminLayout>
  );
}
