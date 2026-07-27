import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ManagerListSkeleton.scss";

type ManagerSkeletonRow = {
  emailWidth: number;
  id: number;
  nameWidth: number;
};

const SKELETON_ROWS: ManagerSkeletonRow[] = [
  { emailWidth: 204, id: 1, nameWidth: 118 },
  { emailWidth: 232, id: 2, nameWidth: 148 },
  { emailWidth: 184, id: 3, nameWidth: 104 },
  { emailWidth: 218, id: 4, nameWidth: 136 },
  { emailWidth: 196, id: 5, nameWidth: 126 },
];

function ManagerIdentitySkeleton({ row }: { row: ManagerSkeletonRow }) {
  return (
    <span className="manager-identity manager-list-skeleton__identity">
      <Skeleton height={44} variant="circle" width={44} />
      <Skeleton height={18} width={row.nameWidth} />
    </span>
  );
}

export function ManagerListSkeleton() {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<ManagerSkeletonRow>>>(
    () => [
      {
        className: "manager-table__cell--manager",
        key: "manager",
        label: t.company.manager.table.manager,
        render: (row) => <ManagerIdentitySkeleton row={row} />,
        variant: "primary",
      },
      {
        className: "manager-table__cell--email",
        key: "email",
        label: t.company.manager.table.email,
        render: (row) => <Skeleton height={14} width={row.emailWidth} />,
      },
      {
        className: "manager-table__cell--count",
        key: "companiesCount",
        label: t.company.manager.table.companies,
        render: () => <Skeleton height={14} width={28} />,
      },
      {
        className: "manager-table__cell--count",
        key: "boothsCount",
        label: t.company.manager.table.booths,
        render: () => <Skeleton height={14} width={24} />,
      },
    ],
    [t],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.company.manager.table.loading}
      </span>
      <div aria-hidden="true" className="manager-list-skeleton">
        <DataTable
          ariaLabel={t.company.manager.table.ariaLabel}
          className="manager-table manager-list-skeleton__table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
