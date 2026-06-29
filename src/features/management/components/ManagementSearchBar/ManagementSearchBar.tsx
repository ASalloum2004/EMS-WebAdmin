import { SearchFilterBar } from "../../../../components";

interface ManagementSearchBarProps {
  inputAriaLabel?: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  value: string;
}

export function ManagementSearchBar({
  inputAriaLabel = "Search halls",
  onChange,
  onFilterClick,
  placeholder = "Search by id, number, or type...",
  showFilterButton = true,
  value,
}: ManagementSearchBarProps) {
  return (
    <SearchFilterBar
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      filterLabel="Filter"
      inputAriaLabel={inputAriaLabel}
      filterAriaLabel="Open filters"
      onFilterClick={onFilterClick}
      showFilterButton={showFilterButton}
    />
  );
}
