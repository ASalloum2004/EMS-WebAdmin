import { useMemo, useState } from "react";
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
  NotificationTable,
  type NotificationFilterOption,
} from "../components";
import {
  emptyNotificationFilters,
  filterNotifications,
  notificationMockData,
} from "../data";
import "./NotificationsPage.scss";

const PAGE_SIZE = 4;

const initialUiState = {
  appliedFilters: emptyNotificationFilters,
  currentPage: 1,
  draftFilters: emptyNotificationFilters,
  isFilterPanelOpen: false,
  searchQuery: "",
};

export function NotificationsPage() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState(notificationMockData);
  const [ui, setUi] = useState(initialUiState);
  const filteredNotifications = useMemo(
    () =>
      filterNotifications(
        notifications,
        ui.searchQuery,
        ui.appliedFilters,
      ),
    [notifications, ui.appliedFilters, ui.searchQuery],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / PAGE_SIZE),
  );
  const currentPage = Math.min(ui.currentPage, totalPages);
  const visibleNotifications = filteredNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasActiveFilters = Boolean(
    ui.appliedFilters.status || ui.appliedFilters.type,
  );
  const hasActiveCriteria =
    Boolean(ui.searchQuery.trim()) || hasActiveFilters;
  const hasUnreadNotifications = notifications.some(
    (notification) => notification.status === "unread",
  );
  const statusOptions: NotificationFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    {
      label: t.notifications.notificationStatuses.unread,
      value: "unread",
    },
    {
      label: t.notifications.notificationStatuses.read,
      value: "read",
    },
  ];
  const typeOptions: NotificationFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    {
      label: t.notifications.notificationTypes.success,
      value: "success",
    },
    {
      label: t.notifications.notificationTypes.warning,
      value: "warning",
    },
    {
      label: t.notifications.notificationTypes.error,
      value: "error",
    },
    {
      label: t.notifications.notificationTypes.info,
      value: "info",
    },
  ];

  function handleSearchChange(value: string) {
    setUi((state) => ({
      ...state,
      currentPage: 1,
      searchQuery: value,
    }));
  }

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
    setUi((state) => ({
      ...state,
      appliedFilters: { ...state.draftFilters },
      currentPage: 1,
      isFilterPanelOpen: false,
    }));
  }

  function handleResetFilters() {
    setUi((state) => ({
      ...state,
      appliedFilters: emptyNotificationFilters,
      currentPage: 1,
      draftFilters: emptyNotificationFilters,
    }));
  }

  function handleMarkAllAsRead() {
    setNotifications((items) =>
      items.map((item) =>
        item.status === "unread" ? { ...item, status: "read" } : item,
      ),
    );
  }

  return (
    <ManagementLayout>
      <div className="notifications-page">
        <header className="notifications-page__header">
          <h1>{t.notifications.title}</h1>
          <p>{t.notifications.description}</p>
        </header>

        <Card
          aria-label={t.notifications.panelAriaLabel}
          bodyClassName="notifications-page__panel-body"
          className="notifications-page__panel"
        >
          <div className="notifications-page__toolbar">
            <SearchFilterBar
              className="notifications-page__search"
              filterAriaLabel={t.notifications.filters.filterAriaLabel}
              filterLabel={t.common.filter}
              inputAriaLabel={t.notifications.search.ariaLabel}
              isFilterActive={hasActiveFilters}
              onChange={handleSearchChange}
              onFilterClick={handleToggleFilters}
              placeholder={t.notifications.search.placeholder}
              showFilterButton
              value={ui.searchQuery}
            />
            <button
              className="data-table__action-button notifications-page__mark-all"
              disabled={!hasUnreadNotifications}
              onClick={handleMarkAllAsRead}
              type="button"
            >
              <MarkAllReadIcon aria-hidden="true" size={17} strokeWidth={2} />
              <span>{t.notifications.actions.markAllAsRead}</span>
            </button>
          </div>

          {ui.isFilterPanelOpen ? (
            <NotificationFiltersPanel
              filters={ui.draftFilters}
              onApply={handleApplyFilters}
              onChange={(draftFilters) =>
                setUi((state) => ({ ...state, draftFilters }))
              }
              onReset={handleResetFilters}
              statusOptions={statusOptions}
              typeOptions={typeOptions}
            />
          ) : null}

          <div className="notifications-page__divider" />

          <section className="notifications-page__table-panel">
            <NotificationTable
              emptyMessage={
                hasActiveCriteria
                  ? t.notifications.table.noResults
                  : t.notifications.table.empty
              }
              items={visibleNotifications}
            />
            {filteredNotifications.length ? (
              <TableFooter
                className="notifications-page__footer"
                currentPage={currentPage}
                onPageChange={(page) =>
                  setUi((state) => ({ ...state, currentPage: page }))
                }
                perPage={PAGE_SIZE}
                showItemRange
                showPageSizeSelector={false}
                showSinglePage
                totalItems={filteredNotifications.length}
                totalPages={totalPages}
              />
            ) : null}
          </section>
        </Card>
      </div>
    </ManagementLayout>
  );
}
