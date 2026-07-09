import { useCallback, useMemo, useState } from "react";

export type ServiceSortValue = "none" | "price_asc" | "price_desc";

type UseServiceSortOptions = {
  onSortChange?: () => void;
};

export function getServiceSortParam(sortValue: ServiceSortValue) {
  if (sortValue === "price_asc") {
    return "price";
  }

  if (sortValue === "price_desc") {
    return "-price";
  }

  return undefined;
}

export function useServiceSort({ onSortChange }: UseServiceSortOptions = {}) {
  const [sortValue, setSortValue] = useState<ServiceSortValue>("none");
  const [appliedSortValue, setAppliedSortValue] =
    useState<ServiceSortValue>("none");

  const sortParam = useMemo(
    () => getServiceSortParam(appliedSortValue),
    [appliedSortValue],
  );

  const applySort = useCallback(() => {
    setAppliedSortValue(sortValue);
    onSortChange?.();
  }, [onSortChange, sortValue]);

  const clearSort = useCallback(() => {
    setSortValue("none");
    setAppliedSortValue("none");
    onSortChange?.();
  }, [onSortChange]);

  return {
    sortValue,
    setSortValue,
    appliedSortValue,
    sortParam,
    applySort,
    clearSort,
    hasActiveSort: appliedSortValue !== "none",
  };
}
