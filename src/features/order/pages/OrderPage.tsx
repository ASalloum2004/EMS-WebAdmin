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
import { getOrderColumns } from "../components";
import { orderPresentationData } from "../data";
import { useOrderView } from "../hooks";
import "./OrderPage.scss";

type SummaryCard = {
  icon: ReactNode;
  key: "total" | "pending" | "approved";
  label: string;
  value: number;
};

export function OrderPage() {
  const { language, t } = useI18n();
  const orderView = useOrderView(orderPresentationData);
  const columns = useMemo(
    () => getOrderColumns(t, language),
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
      value: orderPresentationData.length,
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
      value: orderPresentationData.filter(
        (order) => order.status === "pending",
      ).length,
    },
    {
      icon: (
        <ApprovedIcon aria-hidden="true" size={22} strokeWidth={1.8} />
      ),
      key: "approved",
      label: t.order.summary.approved,
      value: orderPresentationData.filter(
        (order) => order.status === "approved",
      ).length,
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
              inputAriaLabel={t.order.filters.searchAriaLabel}
              onChange={orderView.onSearchChange}
              placeholder={t.order.filters.searchPlaceholder}
              showFilterButton
              value={orderView.searchQuery}
            />

            <DataTable
              ariaLabel={t.order.table.ariaLabel}
              className="order-page__table"
              columns={columns}
              emptyMessage={t.order.table.empty}
              getItemKey={(order) => order.requestId}
              items={orderView.visibleOrders}
            />

            <TableFooter
              className="order-page__footer"
              currentPage={orderView.currentPage}
              onPageChange={orderView.setCurrentPage}
              perPage={orderView.perPage}
              totalItems={orderView.totalOrderCount}
              totalPages={orderView.totalPages}
            />
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}
