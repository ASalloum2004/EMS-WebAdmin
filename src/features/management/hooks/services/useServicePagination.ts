import { useCallback, useEffect, useMemo, useState } from "react";
import type { PaginationMeta } from "../../types";

function clampPositiveInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getSafeTotalItems(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

function getTotalItemsFromMeta(meta: PaginationMeta, fallbackCount: number) {
  const total = meta.total;

  if (typeof total === "number" && Number.isFinite(total) && total >= 0) {
    return Math.max(Math.trunc(total), fallbackCount);
  }

  return fallbackCount;
}

type ApplyPaginationResultOptions = {
  itemCount: number;
  meta: PaginationMeta;
};

type UseServicePaginationOptions = {
  initialPerPage?: number;
};

export function useServicePagination({
  initialPerPage = 3,
}: UseServicePaginationOptions = {}) {
  const [currentPage, setCurrentPageState] = useState(1);
  const [perPage, setPerPageState] = useState(
    clampPositiveInteger(initialPerPage),
  );
  const [totalItems, setTotalItemsState] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / perPage)),
    [perPage, totalItems],
  );

  const resetPage = useCallback(() => {
    setCurrentPageState(1);
  }, []);

  const setCurrentPage = useCallback(
    (page: number) => {
      const nextPage = clampPositiveInteger(page);

      setCurrentPageState(Math.min(nextPage, totalPages));
    },
    [totalPages],
  );

  const setPerPage = useCallback((nextPerPage: number) => {
    setPerPageState(clampPositiveInteger(nextPerPage));
    setCurrentPageState(1);
  }, []);

  const setTotalItems = useCallback((nextTotalItems: number) => {
    setTotalItemsState(getSafeTotalItems(nextTotalItems));
  }, []);

  const applyPaginationResult = useCallback(
    ({ itemCount, meta }: ApplyPaginationResultOptions) => {
      setTotalItemsState(getTotalItemsFromMeta(meta, itemCount));

      if (
        typeof meta.current_page === "number" &&
        Number.isFinite(meta.current_page) &&
        meta.current_page >= 1
      ) {
        setCurrentPageState(Math.trunc(meta.current_page));
      }

      if (
        typeof meta.per_page === "number" &&
        Number.isFinite(meta.per_page) &&
        meta.per_page >= 1
      ) {
        setPerPageState(Math.trunc(meta.per_page));
      }
    },
    [],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageState(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalItems,
    setTotalItems,
    totalPages,
    resetPage,
    applyPaginationResult,
  };
}
