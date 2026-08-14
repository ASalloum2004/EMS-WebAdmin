import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ManagementTableSkeleton.scss";

export type ManagementTableSkeletonVariant = "booth" | "eventHall" | "hall";

type ManagementSkeletonRow = {
  id: number;
  primaryWidth: number;
  valueWidth: number;
};

const SKELETON_ROWS: ManagementSkeletonRow[] = [
  { id: 1, primaryWidth: 118, valueWidth: 72 },
  { id: 2, primaryWidth: 148, valueWidth: 86 },
  { id: 3, primaryWidth: 104, valueWidth: 64 },
  { id: 4, primaryWidth: 136, valueWidth: 78 },
  { id: 5, primaryWidth: 124, valueWidth: 70 },
];

export function ManagementTableSkeleton({
  variant,
}: {
  variant: ManagementTableSkeletonVariant;
}) {
  const { t } = useI18n();
  const translations =
    variant === "hall"
      ? t.management.halls
      : variant === "booth"
        ? t.management.booths
        : t.management.eventHalls;
  const columns = useMemo<Array<DataTableColumn<ManagementSkeletonRow>>>(() => {
    if (variant === "hall") {
      return [
        {
          key: "type",
          label: t.management.filters.type,
          render: (row) => <Skeleton height={18} width={row.primaryWidth} />,
          supportingText: () => <Skeleton height={13} width={64} />,
          variant: "primary",
        },
        {
          key: "area",
          label: t.management.booths.area,
          render: (row) => <Skeleton height={14} width={row.valueWidth} />,
        },
      ];
    }

    const isBooth = variant === "booth";

    return [
      {
        key: "number",
        label: isBooth
          ? t.management.booths.number
          : t.management.eventHalls.number,
        render: (row) => <Skeleton height={18} width={row.primaryWidth} />,
        variant: "primary",
      },
      {
        key: "area",
        label: isBooth
          ? t.management.booths.area
          : t.management.eventHalls.area,
        render: (row) => <Skeleton height={14} width={row.valueWidth} />,
      },
      {
        key: "price",
        label: isBooth
          ? t.management.booths.price
          : t.management.eventHalls.pricePerHour,
        render: () => <Skeleton height={14} width={88} />,
      },
      ...(isBooth
        ? [
            {
              key: "status",
              label: t.management.booths.status.label,
              render: () => <Skeleton height={26} variant="pill" width={82} />,
            } satisfies DataTableColumn<ManagementSkeletonRow>,
          ]
        : []),
    ];
  }, [t, variant]);

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {translations.loading}
      </span>
      <div aria-hidden="true" className="management-table-skeleton">
        <DataTable
          actions={
            variant === "hall"
              ? undefined
              : () => <Skeleton height={36} variant="rect" width={68} />
          }
          ariaLabel={translations.ariaLabel}
          className={variant === "booth" ? "management-booth-table" : undefined}
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
