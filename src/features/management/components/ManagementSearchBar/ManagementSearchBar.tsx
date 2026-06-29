import { SearchFilterBar } from "../../../../components";

interface ManagementSearchBarProps {
  onChange: (value: string) => void;
  value: string;
}

export function ManagementSearchBar({
  onChange,
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
    />
  );
}
