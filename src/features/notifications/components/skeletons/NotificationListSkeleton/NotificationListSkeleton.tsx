import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./NotificationListSkeleton.scss";

type NotificationSkeletonRow = {
  id: number;
  titleWidth: number;
};

const SKELETON_ROWS: NotificationSkeletonRow[] = [
  { id: 1, titleWidth: 188 },
  { id: 2, titleWidth: 226 },
  { id: 3, titleWidth: 172 },
  { id: 4, titleWidth: 204 },
];

export function NotificationListSkeleton() {
  const { t } = useI18n();
  const labels = t.notifications.table;
  const columns = useMemo<Array<DataTableColumn<NotificationSkeletonRow>>>(
    () => [
      {
        className: "notification-table__cell--notification",
        key: "notification",
        label: labels.notification,
        render: (row) => <Skeleton height={18} width={row.titleWidth} />,
        variant: "primary",
      },
      {
        className: "notification-table__cell--status",
        key: "status",
        label: labels.status,
        render: () => <Skeleton height={26} variant="pill" width={76} />,
      },
      {
        className: "notification-table__cell--date",
        key: "date",
        label: labels.date,
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
      <div aria-hidden="true" className="notification-list-skeleton">
        <DataTable
          ariaLabel={labels.ariaLabel}
          className="notification-table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
