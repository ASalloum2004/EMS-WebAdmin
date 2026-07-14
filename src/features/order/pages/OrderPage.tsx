import { useMemo, type ReactNode } from "react";
import { Card, DataTable, TableFooter } from "../../../components";
import { useI18n } from "../../../i18n";
import { AdminLayout } from "../../../layouts";
import { OrderFilters, OrderStatusTabs, getOrderColumns } from "../components";
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
      icon: <SummaryIcon variant="total" />,
      key: "total",
      label: t.order.summary.totalRequests,
      value: orderPresentationData.length,
    },
    {
      icon: <SummaryIcon variant="pending" />,
      key: "pending",
      label: t.order.summary.pendingRequest,
      value: orderPresentationData.filter(
        (order) => order.status === "pending",
      ).length,
    },
    {
      icon: <SummaryIcon variant="approved" />,
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
            <OrderStatusTabs
              activeTab={orderView.activeTab}
              onTabChange={orderView.onTabChange}
            />

            <OrderFilters
              dateFilter={orderView.dateFilter}
              onDateFilterChange={orderView.onDateFilterChange}
              onOrderTypeFilterChange={orderView.onOrderTypeFilterChange}
              onSearchChange={orderView.onSearchChange}
              orderTypeFilter={orderView.orderTypeFilter}
              searchQuery={orderView.searchQuery}
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
              totalItems={orderView.filteredOrderCount}
              totalPages={orderView.totalPages}
            />
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
}

function SummaryIcon({
  variant,
}: {
  variant: "total" | "pending" | "approved";
}) {
  if (variant === "pending") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5ZM4.25 12a7.75 7.75 0 1 1 15.5 0 7.75 7.75 0 0 1-15.5 0Zm7-4.25a.75.75 0 0 1 1.5 0v3.94l2.72 1.57a.75.75 0 1 1-.75 1.3l-3.1-1.8a.75.75 0 0 1-.37-.65V7.75Z" />
      </svg>
    );
  }

  if (variant === "approved") {
    return (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5ZM4.25 12a7.75 7.75 0 1 1 15.5 0 7.75 7.75 0 0 1-15.5 0Zm12.28-3.03a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 0 1-1.06 0l-2.75-2.75a.75.75 0 1 1 1.06-1.06l2.22 2.22 4.72-4.72a.75.75 0 0 1 1.06 0Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M7.75 2A2.75 2.75 0 0 0 5 4.75v14.5A2.75 2.75 0 0 0 7.75 22h8.5A2.75 2.75 0 0 0 19 19.25V4.75A2.75 2.75 0 0 0 16.25 2h-8.5ZM6.5 4.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v14.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25V4.75Zm3 2.25a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Zm0 4a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Zm0 4a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
    </svg>
  );
}
