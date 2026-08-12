import {
  filterByClientFilters,
  filterBySearchQuery,
} from "../../../components";
import type { ReportFilters, ReportItem } from "../types";

export const emptyReportFilters: ReportFilters = {
  status: "",
  type: "",
};

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
