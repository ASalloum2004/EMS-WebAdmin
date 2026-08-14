import type { DataTableColumn } from "../../../components";
import type { I18nDictionary, SupportedLanguage } from "../../../i18n";
import type {
  BoothRequestApiData,
  BoothRequestStatus,
} from "../types";
import { getTrimmedString } from "../utils/getTrimmedString";

function isBoothRequestStatus(value: string): value is BoothRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function renderStatus(request: BoothRequestApiData, t: I18nDictionary) {
  const rawStatus = String(request.status);
  const isKnownStatus = isBoothRequestStatus(rawStatus);
  const label = isKnownStatus ? t.order.status[rawStatus] : rawStatus;
  const statusClassName = isKnownStatus
    ? `order-status order-status--${rawStatus}`
    : "order-status order-status--unknown";

  return (
    <span className={statusClassName} aria-label={`${t.order.table.status}: ${label}`}>
      {label}
    </span>
  );
}

export function getBoothRequestCompanyDisplayName(
  request: BoothRequestApiData,
  t: I18nDictionary,
) {
  return (
    getTrimmedString(request.company_name) ||
    getTrimmedString(request.company?.name) ||
    t.order.details.emptyValue
  );
}

export function formatRequestDate(date: unknown, language: SupportedLanguage) {
  const normalizedDate = getTrimmedString(date);
  const parsedDate = new Date(normalizedDate.replace(" ", "T"));

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedDate;
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function getBoothRequestColumns(
  t: I18nDictionary,
  language: SupportedLanguage,
): Array<DataTableColumn<BoothRequestApiData>> {
  return [
    {
      key: "company",
      className: "order-table__cell--company",
      label: t.order.table.company,
      render: (request) => getBoothRequestCompanyDisplayName(request, t),
      variant: "primary",
    },
    {
      key: "status",
      className: "order-table__cell--status",
      label: t.order.table.status,
      render: (request) => renderStatus(request, t),
      variant: "badge",
    },
    {
      key: "created_at",
      className: "order-table__cell--created",
      label: t.order.table.createdDate,
      render: (request) => formatRequestDate(request.created_at, language),
      variant: "metric",
    },
  ];
}
