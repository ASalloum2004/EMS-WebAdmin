import { useState } from "react";
import type { OrderPresentationItem } from "../types";

const ORDERS_PER_PAGE = 5;

export function useOrderView(orders: OrderPresentationItem[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQueryState] = useState("");
  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleOrders = orders.slice(
    (safeCurrentPage - 1) * ORDERS_PER_PAGE,
    safeCurrentPage * ORDERS_PER_PAGE,
  );

  return {
    currentPage: safeCurrentPage,
    onSearchChange: setSearchQueryState,
    perPage: ORDERS_PER_PAGE,
    searchQuery,
    setCurrentPage,
    totalOrderCount: orders.length,
    totalPages,
    visibleOrders,
  };
}
