import { useMemo } from "react";
import {
  ErrorNotificationIcon,
  InformationNotificationIcon,
  ReportItemIcon,
  SuccessNotificationIcon,
  WarningNotificationIcon,
} from "../../../../assets/icons/activityIcons";
import { DataTable, type DataTableColumn } from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import type {
  ActivityItem,
  ActivityTab,
  NotificationStatus,
  NotificationType,
  ReportStatus,
  ReportType,
} from "../../types";
import "./ActivityTable.scss";

type ActivityTableProps = {
  activeTab: ActivityTab;
  emptyMessage: string;
  items: ActivityItem[];
};

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconProps = {
    "aria-hidden": true,
    size: 20,
    strokeWidth: 1.9,
  } as const;

  if (type === "success") {
    return <SuccessNotificationIcon {...iconProps} />;
  }

  if (type === "warning") {
    return <WarningNotificationIcon {...iconProps} />;
  }

  if (type === "error") {
    return <ErrorNotificationIcon {...iconProps} />;
  }

  return <InformationNotificationIcon {...iconProps} />;
}

function ActivityIdentity({
  activeTab,
  item,
}: {
  activeTab: ActivityTab;
  item: ActivityItem;
}) {
  const isUnread = activeTab === "notifications" && item.status === "unread";
  const iconClass =
    activeTab === "notifications"
      ? `activity-table__icon--${item.type}`
      : "activity-table__icon--report";

  return (
    <span
      className={
        isUnread
          ? "activity-table__identity activity-table__identity--unread"
          : "activity-table__identity"
      }
    >
      <span
        aria-hidden="true"
        className={`activity-table__icon ${iconClass}`}
      >
        {activeTab === "notifications" ? (
          <NotificationIcon type={item.type as NotificationType} />
        ) : (
          <ReportItemIcon size={20} strokeWidth={1.9} />
        )}
      </span>
      <span className="activity-table__copy">
        <span className="activity-table__title">{item.title}</span>
        <span className="activity-table__description">
          {item.description}
        </span>
      </span>
    </span>
  );
}

function formatActivityDate(
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

function createColumns(
  activeTab: ActivityTab,
  language: SupportedLanguage,
  t: I18nDictionary,
): Array<DataTableColumn<ActivityItem>> {
  const notificationTypeLabels: Record<NotificationType, string> = {
    success: t.notifications.notificationTypes.success,
    warning: t.notifications.notificationTypes.warning,
    error: t.notifications.notificationTypes.error,
    info: t.notifications.notificationTypes.info,
  };
  const notificationStatusLabels: Record<NotificationStatus, string> = {
    unread: t.notifications.notificationStatuses.unread,
    read: t.notifications.notificationStatuses.read,
  };
  const reportTypeLabels: Record<ReportType, string> = {
    issue: t.notifications.reportTypes.issue,
    complaint: t.notifications.reportTypes.complaint,
    safety: t.notifications.reportTypes.safety,
    other: t.notifications.reportTypes.other,
  };
  const reportStatusLabels: Record<ReportStatus, string> = {
    pending: t.notifications.reportStatuses.pending,
    in_review: t.notifications.reportStatuses.inReview,
    resolved: t.notifications.reportStatuses.resolved,
  };

  return [
    {
      className: "activity-table__cell--activity",
      key: "activity",
      label:
        activeTab === "notifications"
          ? t.notifications.table.notification
          : t.notifications.table.report,
      render: (item) => (
        <ActivityIdentity activeTab={activeTab} item={item} />
      ),
      variant: "primary",
    },
    {
      className: "activity-table__cell--type",
      key: "type",
      label: t.notifications.table.type,
      render: (item) => {
        const label =
          activeTab === "notifications"
            ? notificationTypeLabels[item.type as NotificationType]
            : reportTypeLabels[item.type as ReportType];

        return (
          <span
            className={`activity-table__type activity-table__type--${item.type}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      className: "activity-table__cell--status",
      key: "status",
      label: t.notifications.table.status,
      render: (item) => {
        const label =
          activeTab === "notifications"
            ? notificationStatusLabels[item.status as NotificationStatus]
            : reportStatusLabels[item.status as ReportStatus];

        return (
          <span
            className={`activity-table__status activity-table__status--${item.status}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      className: "activity-table__cell--date",
      key: "date",
      label: t.notifications.table.date,
      render: (item) => formatActivityDate(item.createdAt, language),
    },
  ];
}

export function ActivityTable({
  activeTab,
  emptyMessage,
  items,
}: ActivityTableProps) {
  const { language, t } = useI18n();
  const columns = useMemo(
    () => createColumns(activeTab, language, t),
    [activeTab, language, t],
  );

  return (
    <DataTable
      ariaLabel={
        activeTab === "notifications"
          ? t.notifications.table.notificationsAriaLabel
          : t.notifications.table.reportsAriaLabel
      }
      className="activity-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemKey={(item) => item.id}
      items={items}
    />
  );
}
