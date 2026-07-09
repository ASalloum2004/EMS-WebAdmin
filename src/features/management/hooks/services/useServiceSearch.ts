import { useCallback, useState } from "react";

type UseServiceSearchOptions = {
  onSearchChange?: () => void;
};

export function useServiceSearch({
  onSearchChange,
}: UseServiceSearchOptions = {}) {
  const [searchName, setSearchNameState] = useState("");

  const setSearchName = useCallback(
    (nextSearchName: string) => {
      setSearchNameState(nextSearchName);
      onSearchChange?.();
    },
    [onSearchChange],
  );

  const resetSearch = useCallback(() => {
    setSearchNameState("");
    onSearchChange?.();
  }, [onSearchChange]);

  return {
    searchName,
    setSearchName,
    resetSearch,
  };
}
