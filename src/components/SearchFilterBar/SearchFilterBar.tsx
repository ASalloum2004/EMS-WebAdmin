import { useState, type ChangeEvent } from "react";
import "./SearchFilterBar.scss";

interface SearchFilterBarProps {
  className?: string;
  filterAriaLabel?: string;
  filterLabel?: string;
  inputAriaLabel?: string;
  onChange?: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  showFilterButton?: boolean;
  showSearch?: boolean;
  value?: string;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ClientFilterPredicate<T> = (item: T) => boolean;

export function filterBySearchQuery<T>(
  items: T[],
  query: string,
  getSearchableValues: (item: T) => Array<string | number | null | undefined>,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    getSearchableValues(item).some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  );
}

export function filterByClientFilters<T>(
  items: T[],
  filters: Array<ClientFilterPredicate<T>>,
): T[] {
  if (!filters.length) {
    return items;
  }

  return items.filter((item) => filters.every((filter) => filter(item)));
}

export function SearchFilterBar({
  className,
  filterAriaLabel = "Open filters",
  filterLabel = "Filter",
  inputAriaLabel = "Search",
  onChange,
  onFilterClick,
  placeholder = "Search...",
  showFilterButton = true,
  showSearch = true,
  value,
}: SearchFilterBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const inputValue = value ?? internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  }

  return (
    <div
      className={classNames(
        "search-filter-bar",
        !showFilterButton && "search-filter-bar--without-filter",
        !showSearch && "search-filter-bar--without-search",
        className,
      )}
    >
      {showSearch ? (
        <>
          <span className="search-filter-bar__search-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M8.75 3.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5ZM2 8.75a6.75 6.75 0 1 1 12.13 4.07l3.03 3.02a.75.75 0 0 1-1.06 1.06l-3.02-3.03A6.75 6.75 0 0 1 2 8.75Z" />
            </svg>
          </span>

          <input
            className="search-filter-bar__input"
            type="search"
            aria-label={inputAriaLabel}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleChange}
          />
        </>
      ) : null}

      {showFilterButton ? (
        <button
          className="search-filter-bar__filter-button"
          type="button"
          aria-label={filterAriaLabel}
          onClick={onFilterClick}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M3.25 4.5A.75.75 0 0 1 4 3.75h12a.75.75 0 0 1 .57 1.24l-4.82 5.62v3.64a.75.75 0 0 1-.38.65l-2.5 1.42a.75.75 0 0 1-1.12-.65v-5.06L3.43 4.99a.75.75 0 0 1-.18-.49Zm2.38.75 3.45 4.01c.11.14.17.31.17.49v4.63l1-.57V9.75c0-.18.06-.35.17-.49l3.95-4.01H5.63Z" />
          </svg>
          { <span>{filterLabel}</span> }
        </button>
      ) : null}
    </div>
  );
}
