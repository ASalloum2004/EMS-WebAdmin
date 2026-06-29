import { SearchFilterBar } from "../../../../components";

interface MangementSearchBarProps {
  onChange: (value: string) => void;
  value: string;
}

export function MangementSearchBar({
  onChange,
  value,
}: MangementSearchBarProps) {
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
