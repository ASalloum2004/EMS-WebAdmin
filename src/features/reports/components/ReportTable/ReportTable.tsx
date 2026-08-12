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
import type { ReportItem, ReportStatus } from "../../types";
import "./ReportTable.scss";

type ReportTableProps = {
  emptyMessage: string;
  items: ReportItem[];
  onSelectReport?: (report: ReportItem) => void;
};

export function formatReportDate(
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
      </span>
    </span>
  );
}

function createReportColumns(
  language: SupportedLanguage,
  t: I18nDictionary,
): Array<DataTableColumn<ReportItem>> {
  const statusLabels: Record<ReportStatus, string> = {
    pending: t.reports.reportStatuses.pending,
    rejected: t.reports.reportStatuses.rejected,
    resolved: t.reports.reportStatuses.resolved,
  };

  return [
    {
      className: "report-table__cell--report",
      key: "report",
      label: t.reports.table.title,
      render: (item) => <ReportIdentity item={item} />,
      variant: "primary",
    },
    {
      className: "report-table__cell--admin-notes",
      key: "adminNotes",
      label: t.reports.table.adminNotes,
      render: (item) => {
        const hasAdminNotes =
          typeof item.admin_notes === "string" &&
          item.admin_notes.trim().length > 0;

        return hasAdminNotes
          ? t.reports.table.hasNotes
          : t.reports.table.noNotes;
      },
      variant: "badge",
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
      label: t.reports.table.createdAt,
      render: (item) => formatReportDate(item.created_at, language),
    },
  ];
}

export function ReportTable({
  emptyMessage,
  items,
  onSelectReport,
}: ReportTableProps) {
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
      getItemAriaLabel={
        onSelectReport
          ? (item) => `${t.reports.details.openAriaLabel}: ${item.title}`
          : undefined
      }
      getItemKey={(item) => item.id}
      items={items}
      onItemClick={onSelectReport}
    />
  );
}
