import {
  filterByClientFilters,
  filterBySearchQuery,
} from "../../../components";
import type {
  NotificationFilters,
  NotificationItem,
  ReportFilters,
  ReportItem,
} from "../types";

export const emptyNotificationFilters: NotificationFilters = {
  status: "",
  type: "",
};

export const emptyReportFilters: ReportFilters = {
  status: "",
  type: "",
};

export function filterNotifications(
  items: NotificationItem[],
  query: string,
  filters: NotificationFilters,
) {
  const searchedItems = filterBySearchQuery(items, query, (item) => [
    item.title,
  ]);

  return filterByClientFilters(searchedItems, [
    (item) => !filters.status || item.status === filters.status,
    (item) => !filters.type || item.type === filters.type,
  ]);
}

export function filterReports(
  items: ReportItem[],
  query: string,
  filters: ReportFilters,
) {
  const searchedItems = filterBySearchQuery(items, query, (item) => [
    item.title,
  ]);

  return filterByClientFilters(searchedItems, [
    (item) => !filters.status || item.status === filters.status,
    (item) => !filters.type || item.type === filters.type,
  ]);
}

export function hasActiveActivityFilters(filters: {
  status: string;
  type: string;
}) {
  return Boolean(filters.status || filters.type);
}
