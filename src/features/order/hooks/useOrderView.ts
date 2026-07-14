import { useMemo, useState } from "react";
import { filterByClientFilters, filterBySearchQuery } from "../../../components";
import type {
  OrderDateFilter,
  OrderPresentationItem,
  OrderStatusTab,
  OrderTypeFilter,
} from "../types";

const ORDERS_PER_PAGE = 5;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function matchesDateFilter(
  requestDate: string,
  dateFilter: OrderDateFilter,
) {
  if (dateFilter === "all") {
    return true;
  }

  const date = new Date(`${requestDate}T00:00:00`);
  const today = new Date();

  if (dateFilter === "today") {
    return isSameDay(date, today);
  }

  if (dateFilter === "thisMonth") {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    );
  }

  const elapsedDays = Math.floor(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      date.getTime()) /
      DAY_IN_MILLISECONDS,
  );

  return elapsedDays >= 0 && elapsedDays < 7;
}

export function useOrderView(orders: OrderPresentationItem[]) {
  const [activeTab, setActiveTabState] = useState<OrderStatusTab>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilterState] = useState<OrderDateFilter>("all");
  const [orderTypeFilter, setOrderTypeFilterState] =
    useState<OrderTypeFilter>("all");
  const [searchQuery, setSearchQueryState] = useState("");

  const filteredOrders = useMemo(() => {
    const searchResults = filterBySearchQuery(orders, searchQuery, (order) => [
      order.companyName,
      order.requestId,
      order.type,
    ]);

    return filterByClientFilters(searchResults, [
      (order) => activeTab === "all" || order.status === activeTab,
      (order) =>
        orderTypeFilter === "all" || order.type === orderTypeFilter,
      (order) => matchesDateFilter(order.requestDate, dateFilter),
    ]);
  }, [activeTab, dateFilter, orderTypeFilter, orders, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE,
  );

  function updateViewState(update: () => void) {
    update();
    setCurrentPage(1);
  }

  return {
    activeTab,
    currentPage: safeCurrentPage,
    dateFilter,
    filteredOrderCount: filteredOrders.length,
    onDateFilterChange: (value: OrderDateFilter) =>
      updateViewState(() => setDateFilterState(value)),
    onOrderTypeFilterChange: (value: OrderTypeFilter) =>
      updateViewState(() => setOrderTypeFilterState(value)),
    onSearchChange: (value: string) =>
      updateViewState(() => setSearchQueryState(value)),
    onTabChange: (value: OrderStatusTab) =>
      updateViewState(() => setActiveTabState(value)),
    orderTypeFilter,
    perPage: ORDERS_PER_PAGE,
    searchQuery,
    setCurrentPage,
    totalPages,
    visibleOrders,
  };
}
