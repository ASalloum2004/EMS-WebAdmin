import {
  filterByClientFilters,
  filterBySearchQuery,
} from "../../../components";
import type { NotificationFilters, NotificationItem } from "../types";

export const emptyNotificationFilters: NotificationFilters = {
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
