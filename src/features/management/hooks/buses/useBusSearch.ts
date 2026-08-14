import { useCallback, useState } from "react";

type UseBusSearchOptions = {
  onSearchChange?: () => void;
};

export function useBusSearch({
  onSearchChange,
}: UseBusSearchOptions = {}) {
  const [searchLocation, setSearchLocationState] = useState("");

  const setSearchLocation = useCallback(
    (nextSearchLocation: string) => {
      setSearchLocationState(nextSearchLocation);
      onSearchChange?.();
    },
    [onSearchChange],
  );

  return { searchLocation, setSearchLocation };
}
