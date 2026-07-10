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

function getPositiveInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 1
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

function getNonNegativeInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return undefined;
  }

  return Math.trunc(value);
}

type GetNextServicePaginationStateOptions = {
  currentPage: number;
  itemCount: number;
  meta: PaginationMeta;
  perPage: number;
};

export function getNextServicePaginationState({
  currentPage,
  itemCount,
  meta,
  perPage,
}: GetNextServicePaginationStateOptions) {
  const requestedPerPage = clampPositiveInteger(perPage);
  const responsePerPage = getPositiveInteger(meta.perPage);
  const responseTotalItems = getNonNegativeInteger(meta.totalItems);
  const nextTotalItems = responseTotalItems ?? getSafeTotalItems(itemCount);
  const responseTotalPages = getPositiveInteger(meta.totalPages);
  const canUseResponseTotalPages =
    responsePerPage === undefined || responsePerPage === requestedPerPage;
  const nextTotalPages =
    canUseResponseTotalPages && responseTotalPages !== undefined
      ? getSafeTotalPages(responseTotalPages)
      : Math.max(1, Math.ceil(nextTotalItems / requestedPerPage));
  const responseCurrentPage = getPositiveInteger(meta.currentPage);

  return {
    currentPage: Math.min(
      responseCurrentPage ?? clampPositiveInteger(currentPage),
      nextTotalPages,
    ),
    perPage: requestedPerPage,
    totalItems: nextTotalItems,
    totalPages: nextTotalPages,
  };
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
      const nextState = getNextServicePaginationState({
        currentPage,
        itemCount,
        meta,
        perPage,
      });

      setTotalItemsState(nextState.totalItems);
      setResponseTotalPages(nextState.totalPages);
      setCurrentPageState(nextState.currentPage);
    },
    [currentPage, perPage],
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
