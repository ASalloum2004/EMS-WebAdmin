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

function getSafeTotalPages(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

function getTotalItemsFromMeta(meta: PaginationMeta, fallbackCount: number) {
  const totalItems = meta.totalItems;

  if (
    typeof totalItems === "number" &&
    Number.isFinite(totalItems) &&
    totalItems >= 0
  ) {
    return Math.max(Math.trunc(totalItems), fallbackCount);
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
  const [responseTotalPages, setResponseTotalPages] = useState<
    number | undefined
  >();

  const totalPages = useMemo(
    () => responseTotalPages ?? Math.max(1, Math.ceil(totalItems / perPage)),
    [perPage, responseTotalPages, totalItems],
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
    setResponseTotalPages(undefined);
  }, []);

  const setTotalItems = useCallback((nextTotalItems: number) => {
    setTotalItemsState(getSafeTotalItems(nextTotalItems));
  }, []);

  const applyPaginationResult = useCallback(
    ({ itemCount, meta }: ApplyPaginationResultOptions) => {
      const nextPerPage =
        typeof meta.perPage === "number" &&
        Number.isFinite(meta.perPage) &&
        meta.perPage >= 1
          ? Math.trunc(meta.perPage)
          : perPage;
      const nextTotalItems = getTotalItemsFromMeta(meta, itemCount);
      const nextTotalPages =
        typeof meta.totalPages === "number" &&
        Number.isFinite(meta.totalPages) &&
        meta.totalPages >= 1
          ? getSafeTotalPages(meta.totalPages)
          : Math.max(1, Math.ceil(nextTotalItems / nextPerPage));

      setTotalItemsState(nextTotalItems);
      setResponseTotalPages(nextTotalPages);

      if (
        typeof meta.currentPage === "number" &&
        Number.isFinite(meta.currentPage) &&
        meta.currentPage >= 1
      ) {
        setCurrentPageState(
          Math.min(Math.trunc(meta.currentPage), nextTotalPages),
        );
      }

      if (
        typeof meta.perPage === "number" &&
        Number.isFinite(meta.perPage) &&
        meta.perPage >= 1
      ) {
        setPerPageState(nextPerPage);
      }
    },
    [perPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageState(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("[Services] pagination state", {
        currentPage,
        perPage,
        totalItems,
        totalPages,
      });
    }
  }, [currentPage, perPage, totalItems, totalPages]);

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
