import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./CompanyListSkeleton.scss";

type CompanySkeletonRow = {
  companyWidth: number;
  id: number;
  phoneWidth: number;
  sectorWidth: number;
};

const SKELETON_ROWS: CompanySkeletonRow[] = [
  { companyWidth: 126, id: 1, phoneWidth: 112, sectorWidth: 118 },
  { companyWidth: 164, id: 2, phoneWidth: 126, sectorWidth: 142 },
  { companyWidth: 108, id: 3, phoneWidth: 104, sectorWidth: 96 },
  { companyWidth: 148, id: 4, phoneWidth: 118, sectorWidth: 132 },
  { companyWidth: 136, id: 5, phoneWidth: 110, sectorWidth: 108 },
];

function CompanyIdentitySkeleton({ row }: { row: CompanySkeletonRow }) {
  return (
    <span className="company-identity company-list-skeleton__identity">
      <Skeleton borderRadius={12} height={44} variant="rect" width={44} />
      <Skeleton height={18} width={row.companyWidth} />
    </span>
  );
}

export function CompanyListSkeleton() {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<CompanySkeletonRow>>>(
    () => [
      {
        className: "company-table__cell--company",
        key: "company",
        label: t.company.table.company,
        render: (row) => <CompanyIdentitySkeleton row={row} />,
        variant: "primary",
      },
      {
        className: "company-table__cell--sector",
        key: "business_sector",
        label: t.company.table.businessSector,
        render: (row) => <Skeleton height={14} width={row.sectorWidth} />,
      },
      {
        className: "company-table__cell--phone",
        key: "phone",
        label: t.company.table.phone,
        render: (row) => <Skeleton height={14} width={row.phoneWidth} />,
      },
      {
        className: "company-table__cell--count",
        key: "managers_count",
        label: t.company.table.managers,
        render: () => <Skeleton height={14} width={28} />,
      },
      {
        className: "company-table__cell--count",
        key: "booths_count",
        label: t.company.table.booths,
        render: () => <Skeleton height={14} width={24} />,
      },
      {
        className: "company-table__cell--status",
        key: "status",
        label: t.company.table.status,
        render: () => <Skeleton height={28} variant="pill" width={86} />,
        variant: "badge",
      },
    ],
    [t],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.company.table.loading}
      </span>
      <div aria-hidden="true" className="company-list-skeleton">
        <DataTable
          ariaLabel={t.company.table.ariaLabel}
          className="company-table company-list-skeleton__table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
