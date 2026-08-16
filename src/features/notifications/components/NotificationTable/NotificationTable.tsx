import { useMemo } from "react";
import { MarkAllReadIcon } from "../../../../assets/icons/activityIcons";
import {
  DataTable,
  type DataTableColumn,
} from "../../../../components";
import {
  useI18n,
  type I18nDictionary,
  type SupportedLanguage,
} from "../../../../i18n";
import {
  formatNotificationDate,
  getNotificationTypeLabel,
} from "../../data";
import type {
  NotificationItem,
  NotificationStatus,
} from "../../types";
import "./NotificationTable.scss";

type NotificationTableProps = {
  emptyMessage: string;
  isMarkingAsRead: boolean;
  items: NotificationItem[];
  onMarkAsRead: (notification: NotificationItem) => void;
  onSelectNotification: (notification: NotificationItem) => void;
};

function NotificationIdentity({
  item,
  onSelect,
  t,
}: {
  item: NotificationItem;
  onSelect: (notification: NotificationItem) => void;
  t: I18nDictionary;
}) {
  return (
    <span
      className={
        item.status === "unread"
          ? "notification-table__identity notification-table__identity--unread"
          : "notification-table__identity"
      }
    >
      <button
        aria-label={`${t.notifications.details.openAriaLabel}: ${item.title}`}
        className="notification-table__copy notification-table__details-trigger"
        onClick={() => onSelect(item)}
        type="button"
      >
        <span className="notification-table__title">{item.title}</span>
        <span className="notification-table__type-label">
          {getNotificationTypeLabel(item.type, t)}
        </span>
      </button>
    </span>
  );
}

function createNotificationColumns(
  language: SupportedLanguage,
  onSelectNotification: (notification: NotificationItem) => void,
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
      render: (item) => (
        <NotificationIdentity
          item={item}
          onSelect={onSelectNotification}
          t={t}
        />
      ),
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
  isMarkingAsRead,
  items,
  onMarkAsRead,
  onSelectNotification,
}: NotificationTableProps) {
  const { language, t } = useI18n();
  const columns = useMemo(
    () => createNotificationColumns(language, onSelectNotification, t),
    [language, onSelectNotification, t],
  );

  return (
    <DataTable
      ariaLabel={t.notifications.table.ariaLabel}
      className="notification-table"
      columns={columns}
      emptyMessage={emptyMessage}
      getItemKey={(item) => item.id}
      items={items}
      actions={(item) =>
        item.status === "unread" ? (
          <button
            aria-label={`${t.notifications.actions.markAsRead}: ${item.title}`}
            className="data-table__action-button notification-table__mark-read"
            disabled={isMarkingAsRead}
            onClick={() => onMarkAsRead(item)}
            type="button"
          >
            <MarkAllReadIcon aria-hidden="true" size={16} strokeWidth={2} />
            <span>{t.notifications.actions.markAsRead}</span>
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="data-table__action-button notification-table__mark-read notification-table__mark-read--placeholder"
          >
            <MarkAllReadIcon aria-hidden="true" size={16} strokeWidth={2} />
            <span>{t.notifications.actions.markAsRead}</span>
          </span>
        )
      }
    />
  );
}
