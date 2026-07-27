import { useMemo, useState } from "react";
import { MarkAllReadIcon } from "../../../assets/icons/activityIcons";
import { Card, SearchFilterBar, TableFooter } from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  ActivityFiltersPanel,
  ActivityTable,
  ActivityTabs,
  type ActivityFilterOption,
} from "../components";
import {
  emptyNotificationFilters,
  emptyReportFilters,
  filterNotifications,
  filterReports,
  hasActiveActivityFilters,
  notificationMockData,
  reportMockData,
} from "../data";
import type {
  ActivityFilterValues,
  ActivityTab,
  NotificationFilters,
  ReportFilters,
} from "../types";
import "./NotificationsPage.scss";

const PAGE_SIZE = 4;

type ActivityUiState<TFilters> = {
  appliedFilters: TFilters;
  currentPage: number;
  draftFilters: TFilters;
  isFilterPanelOpen: boolean;
  searchQuery: string;
};

const initialNotificationUiState: ActivityUiState<NotificationFilters> = {
  appliedFilters: emptyNotificationFilters,
  currentPage: 1,
  draftFilters: emptyNotificationFilters,
  isFilterPanelOpen: false,
  searchQuery: "",
};

const initialReportUiState: ActivityUiState<ReportFilters> = {
  appliedFilters: emptyReportFilters,
  currentPage: 1,
  draftFilters: emptyReportFilters,
  isFilterPanelOpen: false,
  searchQuery: "",
};

export function NotificationsPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] =
    useState<ActivityTab>("notifications");
  const [notifications, setNotifications] = useState(notificationMockData);
  const [notificationUi, setNotificationUi] = useState(
    initialNotificationUiState,
  );
  const [reportUi, setReportUi] = useState(initialReportUiState);

  const filteredNotifications = useMemo(
    () =>
      filterNotifications(
        notifications,
        notificationUi.searchQuery,
        notificationUi.appliedFilters,
      ),
    [notificationUi.appliedFilters, notificationUi.searchQuery, notifications],
  );
  const filteredReports = useMemo(
    () =>
      filterReports(
        reportMockData,
        reportUi.searchQuery,
        reportUi.appliedFilters,
      ),
    [reportUi.appliedFilters, reportUi.searchQuery],
  );

  const activeUi = activeTab === "notifications" ? notificationUi : reportUi;
  const activeItems =
    activeTab === "notifications" ? filteredNotifications : filteredReports;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const currentPage = Math.min(activeUi.currentPage, totalPages);
  const visibleItems = activeItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasActiveFilters = hasActiveActivityFilters(
    activeUi.appliedFilters,
  );
  const hasActiveCriteria =
    Boolean(activeUi.searchQuery.trim()) || hasActiveFilters;
  const hasUnreadNotifications = notifications.some(
    (notification) => notification.status === "unread",
  );

  const notificationStatusOptions: ActivityFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    {
      label: t.notifications.notificationStatuses.unread,
      value: "unread",
    },
    { label: t.notifications.notificationStatuses.read, value: "read" },
  ];
  const notificationTypeOptions: ActivityFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    {
      label: t.notifications.notificationTypes.success,
      value: "success",
    },
    {
      label: t.notifications.notificationTypes.warning,
      value: "warning",
    },
    { label: t.notifications.notificationTypes.error, value: "error" },
    { label: t.notifications.notificationTypes.info, value: "info" },
  ];
  const reportStatusOptions: ActivityFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    { label: t.notifications.reportStatuses.pending, value: "pending" },
    {
      label: t.notifications.reportStatuses.inReview,
      value: "in_review",
    },
    { label: t.notifications.reportStatuses.resolved, value: "resolved" },
  ];
  const reportTypeOptions: ActivityFilterOption[] = [
    { label: t.notifications.filters.all, value: "" },
    { label: t.notifications.reportTypes.issue, value: "issue" },
    {
      label: t.notifications.reportTypes.complaint,
      value: "complaint",
    },
    { label: t.notifications.reportTypes.safety, value: "safety" },
    { label: t.notifications.reportTypes.other, value: "other" },
  ];

  function handleSearchChange(value: string) {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({
        ...state,
        currentPage: 1,
        searchQuery: value,
      }));
      return;
    }

    setReportUi((state) => ({
      ...state,
      currentPage: 1,
      searchQuery: value,
    }));
  }

  function handleToggleFilters() {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({
        ...state,
        draftFilters: state.isFilterPanelOpen
          ? state.draftFilters
          : { ...state.appliedFilters },
        isFilterPanelOpen: !state.isFilterPanelOpen,
      }));
      return;
    }

    setReportUi((state) => ({
      ...state,
      draftFilters: state.isFilterPanelOpen
        ? state.draftFilters
        : { ...state.appliedFilters },
      isFilterPanelOpen: !state.isFilterPanelOpen,
    }));
  }

  function handleDraftFiltersChange(filters: ActivityFilterValues) {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({
        ...state,
        draftFilters: filters as NotificationFilters,
      }));
      return;
    }

    setReportUi((state) => ({
      ...state,
      draftFilters: filters as ReportFilters,
    }));
  }

  function handleApplyFilters() {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({
        ...state,
        appliedFilters: { ...state.draftFilters },
        currentPage: 1,
        isFilterPanelOpen: false,
      }));
      return;
    }

    setReportUi((state) => ({
      ...state,
      appliedFilters: { ...state.draftFilters },
      currentPage: 1,
      isFilterPanelOpen: false,
    }));
  }

  function handleResetFilters() {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({
        ...state,
        appliedFilters: emptyNotificationFilters,
        currentPage: 1,
        draftFilters: emptyNotificationFilters,
      }));
      return;
    }

    setReportUi((state) => ({
      ...state,
      appliedFilters: emptyReportFilters,
      currentPage: 1,
      draftFilters: emptyReportFilters,
    }));
  }

  function handlePageChange(page: number) {
    if (activeTab === "notifications") {
      setNotificationUi((state) => ({ ...state, currentPage: page }));
      return;
    }

    setReportUi((state) => ({ ...state, currentPage: page }));
  }

  function handleMarkAllAsRead() {
    setNotifications((items) =>
      items.map((item) =>
        item.status === "unread" ? { ...item, status: "read" } : item,
      ),
    );
  }

  const isNotificationsTab = activeTab === "notifications";
  const statusOptions = isNotificationsTab
    ? notificationStatusOptions
    : reportStatusOptions;
  const typeOptions = isNotificationsTab
    ? notificationTypeOptions
    : reportTypeOptions;

  return (
    <ManagementLayout>
      <div className="activity-page">
        <header className="activity-page__header">
          <h1>{t.notifications.title}</h1>
          <p>{t.notifications.description}</p>
        </header>

        <Card
          aria-label={t.notifications.panelAriaLabel}
          bodyClassName="activity-page__panel-body"
          className="activity-page__panel"
        >
          <div className="activity-page__toolbar">
            <SearchFilterBar
              className="activity-page__search"
              filterAriaLabel={
                isNotificationsTab
                  ? t.notifications.filters.notificationsFilterAriaLabel
                  : t.notifications.filters.reportsFilterAriaLabel
              }
              filterLabel={t.common.filter}
              inputAriaLabel={
                isNotificationsTab
                  ? t.notifications.search.notificationsAriaLabel
                  : t.notifications.search.reportsAriaLabel
              }
              isFilterActive={hasActiveFilters}
              onChange={handleSearchChange}
              onFilterClick={handleToggleFilters}
              placeholder={
                isNotificationsTab
                  ? t.notifications.search.notificationsPlaceholder
                  : t.notifications.search.reportsPlaceholder
              }
              showFilterButton
              value={activeUi.searchQuery}
            />

            {isNotificationsTab ? (
              <button
                className="data-table__action-button activity-page__mark-all"
                disabled={!hasUnreadNotifications}
                onClick={handleMarkAllAsRead}
                type="button"
              >
                <MarkAllReadIcon aria-hidden="true" size={17} strokeWidth={2} />
                <span>{t.notifications.actions.markAllAsRead}</span>
              </button>
            ) : null}
          </div>

          {activeUi.isFilterPanelOpen ? (
            <ActivityFiltersPanel
              ariaLabel={
                isNotificationsTab
                  ? t.notifications.filters.notificationsPanelAriaLabel
                  : t.notifications.filters.reportsPanelAriaLabel
              }
              filters={activeUi.draftFilters}
              onApply={handleApplyFilters}
              onChange={handleDraftFiltersChange}
              onReset={handleResetFilters}
              statusOptions={statusOptions}
              typeOptions={typeOptions}
            />
          ) : null}

          <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="activity-page__divider" />

          <section
            aria-labelledby={`recent-activity-${activeTab}-tab`}
            className="activity-page__table-panel"
            id={`recent-activity-${activeTab}-panel`}
            role="tabpanel"
          >
            <ActivityTable
              activeTab={activeTab}
              emptyMessage={
                hasActiveCriteria
                  ? t.notifications.table.noResults
                  : isNotificationsTab
                    ? t.notifications.table.emptyNotifications
                    : t.notifications.table.emptyReports
              }
              items={visibleItems}
            />

            {activeItems.length ? (
              <TableFooter
                className="activity-page__footer"
                currentPage={currentPage}
                onPageChange={handlePageChange}
                perPage={PAGE_SIZE}
                showItemRange
                showPageSizeSelector={false}
                showSinglePage
                totalItems={activeItems.length}
                totalPages={totalPages}
              />
            ) : null}
          </section>
        </Card>
      </div>
    </ManagementLayout>
  );
}
