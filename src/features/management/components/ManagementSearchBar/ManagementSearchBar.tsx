import { SearchFilterBar } from "../../../../components";

interface ManagementSearchBarProps {
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  value: string;
}

export function ManagementSearchBar({
  onChange,
  onFilterClick,
  value,
}: ManagementSearchBarProps) {
  return (
    <SearchFilterBar
      value={value}
      onChange={onChange}
      placeholder="Search by id, number, or type..."
      filterLabel="Filter"
      inputAriaLabel="Search halls"
      filterAriaLabel="Open filters"
      onFilterClick={onFilterClick}
    />
  );
}
