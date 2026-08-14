import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./BoothRequestListSkeleton.scss";

type BoothRequestSkeletonRow = {
  companyWidth: number;
  dateWidth: number;
  id: number;
};

const SKELETON_ROWS: BoothRequestSkeletonRow[] = [
  { companyWidth: 144, dateWidth: 96, id: 1 },
  { companyWidth: 176, dateWidth: 112, id: 2 },
  { companyWidth: 126, dateWidth: 104, id: 3 },
  { companyWidth: 158, dateWidth: 98, id: 4 },
  { companyWidth: 136, dateWidth: 108, id: 5 },
];

export function BoothRequestListSkeleton() {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<BoothRequestSkeletonRow>>>(
    () => [
      {
        className: "order-table__cell--company",
        key: "company",
        label: t.order.table.company,
        render: (row) => <Skeleton height={18} width={row.companyWidth} />,
        variant: "primary",
      },
      {
        className: "order-table__cell--status",
        key: "status",
        label: t.order.table.status,
        render: () => <Skeleton height={28} variant="pill" width={86} />,
        variant: "badge",
      },
      {
        className: "order-table__cell--created",
        key: "created",
        label: t.order.table.createdDate,
        render: (row) => <Skeleton height={14} width={row.dateWidth} />,
      },
    ],
    [t],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.order.table.loading}
      </span>
      <div aria-hidden="true" className="booth-request-list-skeleton">
        <DataTable
          ariaLabel={t.order.table.ariaLabel}
          className="order-page__table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
