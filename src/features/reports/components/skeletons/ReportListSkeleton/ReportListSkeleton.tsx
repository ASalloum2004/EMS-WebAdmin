import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ReportListSkeleton.scss";

type ReportSkeletonRow = {
  id: number;
  titleWidth: number;
};

const SKELETON_ROWS: ReportSkeletonRow[] = [
  { id: 1, titleWidth: 188 },
  { id: 2, titleWidth: 226 },
  { id: 3, titleWidth: 172 },
  { id: 4, titleWidth: 204 },
];

export function ReportListSkeleton() {
  const { t } = useI18n();
  const labels = t.reports.table;
  const columns = useMemo<Array<DataTableColumn<ReportSkeletonRow>>>(
    () => [
      {
        className: "report-table__cell--report",
        key: "title",
        label: labels.title,
        render: (row) => <Skeleton height={18} width={row.titleWidth} />,
        variant: "primary",
      },
      {
        className: "report-table__cell--admin-notes",
        key: "adminNotes",
        label: labels.adminNotes,
        render: () => <Skeleton height={28} variant="pill" width={76} />,
        variant: "badge",
      },
      {
        className: "report-table__cell--status",
        key: "status",
        label: labels.status,
        render: () => <Skeleton height={26} variant="pill" width={82} />,
      },
      {
        className: "report-table__cell--date",
        key: "date",
        label: labels.createdAt,
        render: () => <Skeleton height={14} width={106} />,
      },
    ],
    [labels],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {labels.loading}
      </span>
      <div aria-hidden="true" className="report-list-skeleton">
        <DataTable
          ariaLabel={labels.ariaLabel}
          className="report-table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
