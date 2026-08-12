import { useMemo } from "react";
import { ReportItemIcon } from "../../../../assets/icons/activityIcons";
import {
  DataTable,
  type DataTableColumn,
} from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import type {
  ReportItem,
  ReportStatus,
  ReportType,
} from "../../types";
import "./ReportTable.scss";

type ReportTableProps = {
  emptyMessage: string;
  items: ReportItem[];
};

function formatReportDate(
  createdAt: string,
  language: SupportedLanguage,
) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(language === "ar" ? "ar-SY" : "en-US", {
    dateStyle: "medium",
  }).format(date);
}

function ReportIdentity({ item }: { item: ReportItem }) {
  return (
    <span className="report-table__identity">
      <span aria-hidden="true" className="report-table__icon">
        <ReportItemIcon size={20} strokeWidth={1.9} />
      </span>
      <span className="report-table__copy">
        <span className="report-table__title">{item.title}</span>
        <span className="report-table__description">
          {item.description}
        </span>
      </span>
    </span>
  );
}

function createReportColumns(
  language: SupportedLanguage,
  t: I18nDictionary,
): Array<DataTableColumn<ReportItem>> {
  const typeLabels: Record<ReportType, string> = {
    complaint: t.reports.reportTypes.complaint,
    issue: t.reports.reportTypes.issue,
    other: t.reports.reportTypes.other,
    safety: t.reports.reportTypes.safety,
  };
  const statusLabels: Record<ReportStatus, string> = {
    in_review: t.reports.reportStatuses.inReview,
    pending: t.reports.reportStatuses.pending,
    resolved: t.reports.reportStatuses.resolved,
  };

  return [
    {
      className: "report-table__cell--report",
      key: "report",
      label: t.reports.table.report,
      render: (item) => <ReportIdentity item={item} />,
      variant: "primary",
    },
    {
      className: "report-table__cell--type",
      key: "type",
      label: t.reports.table.type,
      render: (item) => (
        <span
          className={`report-table__type report-table__type--${item.type}`}
        >
          {typeLabels[item.type]}
        </span>
      ),
    },
    {
      className: "report-table__cell--status",
      key: "status",
      label: t.reports.table.status,
      render: (item) => (
        <span
          className={`report-table__status report-table__status--${item.status}`}
        >
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      className: "report-table__cell--date",
      key: "date",
      label: t.reports.table.date,
      render: (item) => formatReportDate(item.createdAt, language),
    },
  ];
}

export function ReportTable({ emptyMessage, items }: ReportTableProps) {
  const { language, t } = useI18n();
  const columns = useMemo(
    () => createReportColumns(language, t),
    [language, t],
  );

  return (
    <DataTable
      ariaLabel={t.reports.table.ariaLabel}
      className="report-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemKey={(item) => item.id}
      items={items}
    />
  );
}
