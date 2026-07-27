import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import type { ActivityTab } from "../../../types";
import "../../ActivityTable/ActivityTable.scss";
import "./ActivityTableSkeleton.scss";

type ActivitySkeletonRow = {
  descriptionWidth: number;
  id: number;
  titleWidth: number;
};

type ActivityTableSkeletonProps = {
  activeTab?: ActivityTab;
};

const skeletonRows: ActivitySkeletonRow[] = [
  { descriptionWidth: 250, id: 1, titleWidth: 186 },
  { descriptionWidth: 310, id: 2, titleWidth: 228 },
  { descriptionWidth: 280, id: 3, titleWidth: 164 },
  { descriptionWidth: 330, id: 4, titleWidth: 210 },
];

function ActivityIdentitySkeleton({ row }: { row: ActivitySkeletonRow }) {
  return (
    <span className="activity-table__identity activity-table-skeleton__identity">
      <Skeleton borderRadius={12} height={40} variant="rect" width={40} />
      <span className="activity-table-skeleton__copy">
        <Skeleton height={17} width={row.titleWidth} />
        <Skeleton height={13} width={row.descriptionWidth} />
      </span>
    </span>
  );
}

export function ActivityTableSkeleton({
  activeTab = "notifications",
}: ActivityTableSkeletonProps) {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<ActivitySkeletonRow>>>(
    () => [
      {
        className: "activity-table__cell--activity",
        key: "activity",
        label:
          activeTab === "notifications"
            ? t.notifications.table.notification
            : t.notifications.table.report,
        render: (row) => <ActivityIdentitySkeleton row={row} />,
        variant: "primary",
      },
      {
        className: "activity-table__cell--type",
        key: "type",
        label: t.notifications.table.type,
        render: () => <Skeleton height={26} variant="pill" width={76} />,
      },
      {
        className: "activity-table__cell--status",
        key: "status",
        label: t.notifications.table.status,
        render: () => <Skeleton height={26} variant="pill" width={82} />,
      },
      {
        className: "activity-table__cell--date",
        key: "date",
        label: t.notifications.table.date,
        render: () => <Skeleton height={14} width={92} />,
      },
    ],
    [activeTab, t],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {activeTab === "notifications"
          ? t.notifications.table.loadingNotifications
          : t.notifications.table.loadingReports}
      </span>
      <div aria-hidden="true" className="activity-table-skeleton">
        <DataTable
          className="activity-table activity-table-skeleton__table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={skeletonRows}
        />
      </div>
    </>
  );
}
