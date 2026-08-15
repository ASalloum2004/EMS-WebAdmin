import { useMemo } from "react";
import {
  ErrorNotificationIcon,
  InformationNotificationIcon,
  SuccessNotificationIcon,
  WarningNotificationIcon,
} from "../../../../assets/icons/activityIcons";
import {
  DataTable,
  type DataTableColumn,
} from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import type {
  NotificationItem,
  NotificationStatus,
  NotificationType,
} from "../../types";
import "./NotificationTable.scss";

type NotificationTableProps = {
  emptyMessage: string;
  items: NotificationItem[];
};

type NotificationVisualType = "success" | "warning" | "error" | "info";

function getNotificationVisualType(
  type: NotificationType,
): NotificationVisualType {
  if (
    type === "success" ||
    type === "warning" ||
    type === "error" ||
    type === "info"
  ) {
    return type;
  }

  return "info";
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const iconProps = {
    "aria-hidden": true,
    size: 20,
    strokeWidth: 1.9,
  } as const;
  const visualType = getNotificationVisualType(type);

  if (visualType === "success") {
    return <SuccessNotificationIcon {...iconProps} />;
  }

  if (visualType === "warning") {
    return <WarningNotificationIcon {...iconProps} />;
  }

  if (visualType === "error") {
    return <ErrorNotificationIcon {...iconProps} />;
  }

  return <InformationNotificationIcon {...iconProps} />;
}

function NotificationIdentity({
  item,
  t,
}: {
  item: NotificationItem;
  t: I18nDictionary;
}) {
  const visualType = getNotificationVisualType(item.type);

  return (
    <span
      className={
        item.status === "unread"
          ? "notification-table__identity notification-table__identity--unread"
          : "notification-table__identity"
      }
    >
      <span
        aria-hidden="true"
        className={`notification-table__icon notification-table__icon--${visualType}`}
      >
        <NotificationIcon type={item.type} />
      </span>
      <span className="notification-table__copy">
        <span className="notification-table__title">{item.title}</span>
        <span className="notification-table__type-label">
          {getNotificationTypeLabel(item.type, t)}
        </span>
      </span>
    </span>
  );
}

function getNotificationTypeLabel(
  type: NotificationType,
  t: I18nDictionary,
) {
  const typeLabels: Record<NotificationVisualType, string> = {
    error: t.notifications.notificationTypes.error,
    info: t.notifications.notificationTypes.info,
    success: t.notifications.notificationTypes.success,
    warning: t.notifications.notificationTypes.warning,
  };
  const visualType = getNotificationVisualType(type);

  if (type === visualType) {
    return typeLabels[visualType];
  }

  return type.replace(/_/g, " ");
}

function formatNotificationDate(
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

function createNotificationColumns(
  language: SupportedLanguage,
  t: I18nDictionary,
): Array<DataTableColumn<NotificationItem>> {
  const statusLabels: Record<NotificationStatus, string> = {
    read: t.notifications.notificationStatuses.read,
    unread: t.notifications.notificationStatuses.unread,
  };

  return [
    {
      className: "notification-table__cell--notification",
      key: "notification",
      label: t.notifications.table.notification,
      render: (item) => <NotificationIdentity item={item} t={t} />,
      variant: "primary",
    },
    {
      className: "notification-table__cell--status",
      key: "status",
      label: t.notifications.table.status,
      render: (item) => (
        <span
          className={`notification-table__status notification-table__status--${item.status}`}
        >
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      className: "notification-table__cell--date",
      key: "date",
      label: t.notifications.table.date,
      render: (item) => formatNotificationDate(item.createdAt, language),
    },
  ];
}

export function NotificationTable({
  emptyMessage,
  items,
}: NotificationTableProps) {
  const { language, t } = useI18n();
  const columns = useMemo(
    () => createNotificationColumns(language, t),
    [language, t],
  );

  return (
    <DataTable
      ariaLabel={t.notifications.table.ariaLabel}
      className="notification-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemKey={(item) => item.id}
      items={items}
    />
  );
}
