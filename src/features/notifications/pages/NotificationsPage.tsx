import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { MarkAllReadIcon } from "../../../assets/icons/activityIcons";
import {
  Card,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  NotificationFiltersPanel,
  NotificationDetailsModal,
  NotificationDeleteConfirmModal,
  NotificationListSkeleton,
  NotificationStatsSkeleton,
  NotificationTable,
  type NotificationFilterOption,
} from "../components";
import { emptyNotificationFilters } from "../data";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useNotificationStatistics,
} from "../hooks";
import type {
  NotificationStatisticsData,
  NotificationItem,
  NotificationView,
} from "../types";
import "./NotificationsPage.scss";

type NotificationSummaryKey = keyof NotificationStatisticsData;

type NotificationSummaryCard = {
  icon: ReactNode;
  key: NotificationSummaryKey;
  label: string;
};

const initialUiState = {
  appliedFilters: emptyNotificationFilters,
  draftFilters: emptyNotificationFilters,
  isFilterPanelOpen: false,
};

export function NotificationsPage() {
  const { language, t } = useI18n();
  const [activeView, setActiveView] =
    useState<NotificationView>("all");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [pendingDeletion, setPendingDeletion] =
    useState<NotificationItem | null>(null);
  const [ui, setUi] = useState(initialUiState);
  const notificationStatistics = useNotificationStatistics(
    t.notifications.summary.loadError,
  );
  const allNotifications = useNotifications({
    enabled: activeView === "all",
    errorFallback: t.notifications.table.loadError,
    type: ui.appliedFilters.type,
    view: "all",
  });
  const unreadNotifications = useNotifications({
    enabled: activeView === "unread",
    errorFallback: t.notifications.table.loadError,
    type: ui.appliedFilters.type,
    view: "unread",
  });
  const activeNotifications =
    activeView === "all" ? allNotifications : unreadNotifications;
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
  const hasActiveFilters = Boolean(ui.appliedFilters.type.trim());
  const hasActiveCriteria = hasActiveFilters;
  const isNotificationListLoading =
    activeNotifications.isLoading || activeNotifications.isRefreshing;
  const summaryCards: NotificationSummaryCard[] = [
    {
      icon: <Bell aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "total_notifications",
      label: t.notifications.summary.totalNotifications,
    },
    {
      icon: <BellRing aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "unread_notifications",
      label: t.notifications.tabs.unreadNotifications,
    },
    {
      icon: <CheckCheck aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "read_notifications",
      label: t.notifications.summary.readNotifications,
    },
  ];
  const typeOptions = useMemo<NotificationFilterOption[]>(() => {
    const notificationTypes = new Set<string>();

    if (ui.draftFilters.type) {
      notificationTypes.add(ui.draftFilters.type);
    }

    activeNotifications.notifications.forEach((notification) => {
      notificationTypes.add(notification.type);
    });

    return [
      { label: t.notifications.filters.all, value: "" },
      ...Array.from(notificationTypes, (type) => ({
        label: type.replace(/_/g, " "),
        value: type,
      })),
    ];
  }, [activeNotifications.notifications, t, ui.draftFilters.type]);
  const refreshNotificationData = useCallback(async () => {
    await Promise.all([
      allNotifications.refetch(),
      unreadNotifications.refetch(),
      notificationStatistics.refetch(),
    ]);
  }, [
    allNotifications.refetch,
    notificationStatistics.refetch,
    unreadNotifications.refetch,
  ]);
  const markAllNotificationsRead = useMarkAllNotificationsRead({
    errorFallback: t.notifications.actions.markAllAsReadError,
    onSuccess: refreshNotificationData,
  });
  const markNotificationRead = useMarkNotificationRead({
    errorFallback: t.notifications.actions.markAsReadError,
    onSuccess: refreshNotificationData,
  });
  const deleteNotification = useDeleteNotification({
    errorFallback: t.notifications.actions.deleteError,
    onSuccess: refreshNotificationData,
  });
  const hasUnreadNotifications = Boolean(
    notificationStatistics.statistics?.unread_notifications,
  );

  function handleToggleFilters() {
    setUi((state) => ({
      ...state,
      draftFilters: state.isFilterPanelOpen
        ? state.draftFilters
        : { ...state.appliedFilters },
      isFilterPanelOpen: !state.isFilterPanelOpen,
    }));
  }

  function handleApplyFilters() {
    allNotifications.setCurrentPage(1);
    unreadNotifications.setCurrentPage(1);
    setUi((state) => ({
      ...state,
      appliedFilters: { ...state.draftFilters },
      isFilterPanelOpen: false,
    }));
  }

  function handleResetFilters() {
    allNotifications.setCurrentPage(1);
    unreadNotifications.setCurrentPage(1);
    setUi((state) => ({
      ...state,
      appliedFilters: emptyNotificationFilters,
      draftFilters: emptyNotificationFilters,
    }));
  }

  function handleViewChange(view: NotificationView) {
    if (view === activeView) {
      return;
    }

    setActiveView(view);

    if (view === "all") {
      allNotifications.setCurrentPage(1);
    } else {
      unreadNotifications.setCurrentPage(1);
    }
  }

  const handleMarkNotificationAsRead = useCallback(
    async (notification: NotificationItem) => {
      const response = await markNotificationRead.markAsRead(notification.id);

      if (response !== null) {
        setSelectedNotification((currentNotification) =>
          currentNotification?.id === notification.id
            ? { ...currentNotification, status: "read" }
            : currentNotification,
        );
      }
    },
    [markNotificationRead.markAsRead],
  );
  const handleOpenDeleteConfirmation = useCallback(
    (notification: NotificationItem) => {
      deleteNotification.clearError();
      setPendingDeletion(notification);
    },
    [deleteNotification.clearError],
  );
  const handleCloseDeleteConfirmation = useCallback(() => {
    if (deleteNotification.deletingNotificationId !== null) {
      return;
    }

    deleteNotification.clearError();
    setPendingDeletion(null);
  }, [deleteNotification.clearError, deleteNotification.deletingNotificationId]);
  const handleConfirmDeleteNotification = useCallback(async () => {
    if (!pendingDeletion) {
      return;
    }

    const notificationId = pendingDeletion.id;
    const response = await deleteNotification.deleteNotification(notificationId);

    if (response !== null) {
      setPendingDeletion(null);
      setSelectedNotification((currentNotification) =>
        currentNotification?.id === notificationId ? null : currentNotification,
      );
    }
  }, [deleteNotification.deleteNotification, pendingDeletion]);

  return (
    <ManagementLayout>
      <div className="notifications-page">
        <header className="notifications-page__header">
          <h1>{t.notifications.title}</h1>
          <p>{t.notifications.description}</p>
        </header>

        <div
          aria-label={t.notifications.title}
          className="notifications-page__tabs"
          role="tablist"
        >
          <button
            aria-controls="notifications-list-panel"
            aria-selected={activeView === "all"}
            className={`notifications-page__tab${
              activeView === "all" ? " notifications-page__tab--active" : ""
            }`}
            onClick={() => handleViewChange("all")}
            role="tab"
            tabIndex={activeView === "all" ? 0 : -1}
            type="button"
          >
            {t.notifications.tabs.allNotifications}
          </button>
          <button
            aria-controls="notifications-list-panel"
            aria-selected={activeView === "unread"}
            className={`notifications-page__tab${
              activeView === "unread"
                ? " notifications-page__tab--active"
                : ""
            }`}
            onClick={() => handleViewChange("unread")}
            role="tab"
            tabIndex={activeView === "unread" ? 0 : -1}
            type="button"
          >
            {t.notifications.tabs.unreadNotifications}
          </button>
        </div>

        {notificationStatistics.isLoading ? (
          <NotificationStatsSkeleton />
        ) : (
          <div
            aria-busy={notificationStatistics.isRefreshing}
            className="notifications-page__summary"
          >
            {summaryCards.map((summaryCard) => {
              const value =
                notificationStatistics.statistics?.[summaryCard.key] ?? null;

              return (
                <Card
                  className="notifications-page__summary-card"
                  icon={summaryCard.icon}
                  iconClassName="notifications-page__summary-icon"
                  key={summaryCard.key}
                  title={summaryCard.label}
                  titleClassName="notifications-page__summary-label"
                >
                  <strong
                    aria-label={
                      value === null
                        ? t.notifications.summary.unavailable
                        : undefined
                    }
                    aria-live="polite"
                    className="notifications-page__summary-value"
                  >
                    {value === null ? "—" : numberFormatter.format(value)}
                  </strong>
                </Card>
              );
            })}
          </div>
        )}

        {notificationStatistics.error ? (
          <div className="notifications-page__state" role="alert">
            <p>
              {notificationStatistics.error || t.notifications.summary.loadError}
            </p>
            <button
              onClick={() => void notificationStatistics.refetch()}
              type="button"
            >
              {t.common.tryAgain}
            </button>
          </div>
        ) : null}

        <Card
          aria-label={t.notifications.panelAriaLabel}
          bodyClassName="notifications-page__panel-body"
          className="notifications-page__panel"
          id="notifications-list-panel"
          role="tabpanel"
        >
          <div aria-busy={isNotificationListLoading}>
            <div className="notifications-page__toolbar">
              <SearchFilterBar
                className="notifications-page__filter"
                filterAriaLabel={t.notifications.filters.filterAriaLabel}
                filterLabel={t.common.filter}
                isFilterActive={hasActiveFilters}
                onFilterClick={handleToggleFilters}
                showFilterButton
                showSearch={false}
              />
              <button
                className="data-table__action-button notifications-page__mark-all"
                disabled={
                  !hasUnreadNotifications ||
                  markAllNotificationsRead.isMarkingAllAsRead ||
                  markNotificationRead.markingNotificationId !== null ||
                  deleteNotification.deletingNotificationId !== null
                }
                onClick={() => void markAllNotificationsRead.markAllAsRead()}
                type="button"
              >
                <MarkAllReadIcon aria-hidden="true" size={17} strokeWidth={2} />
                <span>{t.notifications.actions.markAllAsRead}</span>
              </button>
            </div>

            {markAllNotificationsRead.error ||
            markNotificationRead.error ||
            deleteNotification.error ? (
              <p className="notifications-page__action-error" role="alert">
                {deleteNotification.error ||
                  markNotificationRead.error ||
                  markAllNotificationsRead.error}
              </p>
            ) : null}

            {ui.isFilterPanelOpen ? (
              <NotificationFiltersPanel
                filters={ui.draftFilters}
                onApply={handleApplyFilters}
                onChange={(draftFilters) =>
                  setUi((state) => ({ ...state, draftFilters }))
                }
                onReset={handleResetFilters}
                typeOptions={typeOptions}
              />
            ) : null}

            <div className="notifications-page__divider" />

            <section className="notifications-page__table-panel">
              {isNotificationListLoading ? <NotificationListSkeleton /> : null}

              {!isNotificationListLoading && activeNotifications.error ? (
                <div className="notifications-page__state" role="alert">
                  <p>{activeNotifications.error || t.notifications.table.loadError}</p>
                  <button
                    onClick={() => void activeNotifications.refetch()}
                    type="button"
                  >
                    {t.common.tryAgain}
                  </button>
                </div>
              ) : null}

              {!isNotificationListLoading &&
              (!activeNotifications.error ||
                activeNotifications.notifications.length) ? (
                <NotificationTable
                  emptyMessage={
                    hasActiveCriteria
                      ? t.notifications.table.noResults
                      : t.notifications.table.empty
                  }
                  isMarkingAsRead={
                    markNotificationRead.markingNotificationId !== null ||
                    deleteNotification.deletingNotificationId !== null
                  }
                  isDeleting={
                    deleteNotification.deletingNotificationId !== null
                  }
                  items={activeNotifications.notifications}
                  onDelete={handleOpenDeleteConfirmation}
                  onMarkAsRead={(notification) =>
                    void handleMarkNotificationAsRead(notification)
                  }
                  onSelectNotification={setSelectedNotification}
                />
              ) : null}

              {!isNotificationListLoading &&
              activeNotifications.notifications.length ? (
                <TableFooter
                  className="notifications-page__footer"
                  currentPage={activeNotifications.currentPage}
                  onPageChange={activeNotifications.setCurrentPage}
                  perPage={activeNotifications.perPage}
                  showItemRange
                  showPageSizeSelector={false}
                  showSinglePage
                  totalItems={activeNotifications.totalItems}
                  totalPages={activeNotifications.totalPages}
                />
              ) : null}
            </section>
          </div>
        </Card>
      </div>

      {selectedNotification ? (
        <NotificationDetailsModal
          error={deleteNotification.error || markNotificationRead.error}
          isDeleteConfirmationOpen={Boolean(pendingDeletion)}
          isDeleting={
            deleteNotification.deletingNotificationId === selectedNotification.id
          }
          isMarkingAsRead={
            markNotificationRead.markingNotificationId === selectedNotification.id
          }
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onDelete={handleOpenDeleteConfirmation}
          onMarkAsRead={(notification) =>
            void handleMarkNotificationAsRead(notification)
          }
        />
      ) : null}

      {pendingDeletion ? (
        <NotificationDeleteConfirmModal
          error={deleteNotification.error}
          isPending={
            deleteNotification.deletingNotificationId === pendingDeletion.id
          }
          notification={pendingDeletion}
          onCancel={handleCloseDeleteConfirmation}
          onConfirm={() => void handleConfirmDeleteNotification()}
        />
      ) : null}
    </ManagementLayout>
  );
}
