import type { DataTableColumn } from "../../../components";
import type { I18nDictionary, SupportedLanguage } from "../../../i18n";
import type { OrderPresentationItem, OrderStatus } from "../types";

function renderCompanyIdentity(order: OrderPresentationItem) {
  return (
    <span className="order-company">
      <span className="order-company__avatar" aria-hidden="true">
        {order.companyInitials}
      </span>
      <span className="order-company__name" dir="auto">
        {order.companyName}
      </span>
    </span>
  );
}

function renderStatus(status: OrderStatus, t: I18nDictionary) {
  return (
    <span className={`order-status order-status--${status}`}>
      {t.order.status[status]}
    </span>
  );
}

function formatRequestDate(date: string, language: SupportedLanguage) {
  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function getOrderColumns(
  t: I18nDictionary,
  language: SupportedLanguage,
): Array<DataTableColumn<OrderPresentationItem>> {
  return [
    {
      key: "company",
      label: t.order.table.company,
      render: renderCompanyIdentity,
      supportingText: (order) => t.order.types[order.type],
      variant: "primary",
    },
    {
      key: "requestDate",
      className: "order-table__cell--date",
      label: t.order.table.requestDate,
      render: (order) => formatRequestDate(order.requestDate, language),
      variant: "metric",
    },
    {
      key: "requestId",
      className: "order-table__cell--id",
      label: t.order.table.requestId,
      render: (order) => order.requestId,
      variant: "metric",
    },
    {
      key: "status",
      label: t.order.table.status,
      render: (order) => renderStatus(order.status, t),
      variant: "badge",
    },
  ];
}
