import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./VisitorTableSkeleton.scss";

type VisitorSkeletonRow = {
  emailWidth: number;
  id: number;
  jobWidth: number;
  locationWidth: number;
  nameWidth: number;
  phoneWidth: number;
};

const SKELETON_ROWS: VisitorSkeletonRow[] = [
  { emailWidth: 176, id: 1, jobWidth: 104, locationWidth: 118, nameWidth: 126, phoneWidth: 106 },
  { emailWidth: 204, id: 2, jobWidth: 126, locationWidth: 142, nameWidth: 154, phoneWidth: 118 },
  { emailWidth: 164, id: 3, jobWidth: 92, locationWidth: 104, nameWidth: 112, phoneWidth: 102 },
  { emailWidth: 188, id: 4, jobWidth: 116, locationWidth: 132, nameWidth: 142, phoneWidth: 112 },
  { emailWidth: 196, id: 5, jobWidth: 98, locationWidth: 124, nameWidth: 132, phoneWidth: 108 },
];

function VisitorIdentitySkeleton({ row }: { row: VisitorSkeletonRow }) {
  return (
    <span className="visitor-identity visitor-table-skeleton__identity">
      <Skeleton height={44} variant="circle" width={44} />
      <span className="visitor-identity__copy">
        <Skeleton height={18} width={row.nameWidth} />
        <Skeleton height={13} width={row.locationWidth} />
      </span>
    </span>
  );
}

export function VisitorTableSkeleton() {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<VisitorSkeletonRow>>>(
    () => [
      {
        className: "visitor-table__cell--visitor",
        key: "visitor",
        label: t.visitor.table.visitor,
        render: (row) => <VisitorIdentitySkeleton row={row} />,
        variant: "primary",
      },
      {
        className: "visitor-table__cell--gender",
        key: "gender",
        label: t.visitor.table.gender,
        render: () => <Skeleton height={14} width={54} />,
      },
      {
        className: "visitor-table__cell--job",
        key: "job",
        label: t.visitor.table.job,
        render: (row) => <Skeleton height={14} width={row.jobWidth} />,
      },
      {
        className: "visitor-table__cell--email",
        key: "email",
        label: t.visitor.table.email,
        render: (row) => <Skeleton height={14} width={row.emailWidth} />,
      },
      {
        className: "visitor-table__cell--phone",
        key: "phone",
        label: t.visitor.table.phone,
        render: (row) => <Skeleton height={14} width={row.phoneWidth} />,
      },
    ],
    [t],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.visitor.table.loading}
      </span>
      <div aria-hidden="true" className="visitor-table-skeleton">
        <DataTable
          ariaLabel={t.visitor.table.ariaLabel}
          className="visitor-page__table visitor-table-skeleton__table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
