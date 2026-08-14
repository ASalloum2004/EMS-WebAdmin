import { useMemo } from "react";
import {
  DataTable,
  Skeleton,
  type DataTableColumn,
} from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./EventRequestListSkeleton.scss";

type EventRequestSkeletonRow = {
  dateWidth: number;
  id: number;
  titleWidth: number;
};

const SKELETON_ROWS: EventRequestSkeletonRow[] = [
  { dateWidth: 132, id: 1, titleWidth: 162 },
  { dateWidth: 148, id: 2, titleWidth: 196 },
  { dateWidth: 126, id: 3, titleWidth: 144 },
  { dateWidth: 142, id: 4, titleWidth: 182 },
];

export function EventRequestListSkeleton() {
  const { t } = useI18n();
  const labels = t.order.eventRequests.table;
  const columns = useMemo<Array<DataTableColumn<EventRequestSkeletonRow>>>(
    () => [
      {
        key: "title",
        label: labels.eventTitle,
        render: (row) => <Skeleton height={18} width={row.titleWidth} />,
        variant: "primary",
      },
      {
        className: "event-request-table__cell--event",
        key: "type",
        label: labels.eventType,
        render: () => (
          <span className="event-request-table__stack">
            <Skeleton height={24} variant="pill" width={78} />
          </span>
        ),
      },
      {
        className: "event-request-table__cell--start",
        key: "start",
        label: labels.startTime,
        render: (row) => <Skeleton height={14} width={row.dateWidth} />,
      },
      {
        className: "event-request-table__cell--end",
        key: "end",
        label: labels.endTime,
        render: (row) => <Skeleton height={14} width={row.dateWidth} />,
      },
      {
        className: "event-request-table__cell--created",
        key: "created",
        label: labels.createdAt,
        render: () => <Skeleton height={14} width={104} />,
      },
      {
        className: "event-request-table__cell--status",
        key: "status",
        label: labels.eventStatus,
        render: () => <Skeleton height={28} variant="pill" width={86} />,
        variant: "badge",
      },
    ],
    [labels],
  );

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {labels.loading}
      </span>
      <div aria-hidden="true" className="event-request-list-skeleton">
        <DataTable
          ariaLabel={labels.ariaLabel}
          className="order-page__table event-request-table"
          columns={columns}
          getItemKey={(row) => row.id}
          items={SKELETON_ROWS}
        />
      </div>
    </>
  );
}
