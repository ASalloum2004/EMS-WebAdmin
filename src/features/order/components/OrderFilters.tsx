import { SearchFilterBar } from "../../../components";
import { useI18n } from "../../../i18n";
import type { OrderDateFilter, OrderTypeFilter } from "../types";
import "./OrderFilters.scss";

interface OrderFiltersProps {
  dateFilter: OrderDateFilter;
  onDateFilterChange: (value: OrderDateFilter) => void;
  onOrderTypeFilterChange: (value: OrderTypeFilter) => void;
  onSearchChange: (value: string) => void;
  orderTypeFilter: OrderTypeFilter;
  searchQuery: string;
}

export function OrderFilters({
  dateFilter,
  onDateFilterChange,
  onOrderTypeFilterChange,
  onSearchChange,
  orderTypeFilter,
  searchQuery,
}: OrderFiltersProps) {
  const { t } = useI18n();

  return (
    <div className="order-filters">
      <SearchFilterBar
        className="order-filters__search"
        inputAriaLabel={t.order.filters.searchAriaLabel}
        onChange={onSearchChange}
        placeholder={t.order.filters.searchPlaceholder}
        showFilterButton={false}
        value={searchQuery}
      />

      <label className="order-filters__select-control">
        <span className="order-filters__label">{t.order.filters.date}</span>
        <svg
          className="order-filters__leading-icon"
          viewBox="0 0 20 20"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M6.25 2a.75.75 0 0 1 .75.75V4h6V2.75a.75.75 0 0 1 1.5 0V4h.75A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4h.75V2.75A.75.75 0 0 1 6.25 2ZM3.5 8v7.25c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25V8h-13Zm1.25-2.5c-.69 0-1.25.56-1.25 1.25v.25h13v-.25c0-.69-.56-1.25-1.25-1.25H4.75Z" />
        </svg>
        <select
          aria-label={t.order.filters.date}
          value={dateFilter}
          onChange={(event) =>
            onDateFilterChange(event.target.value as OrderDateFilter)
          }
        >
          <option value="all">{t.order.filters.allDates}</option>
          <option value="today">{t.order.filters.today}</option>
          <option value="thisWeek">{t.order.filters.thisWeek}</option>
          <option value="thisMonth">{t.order.filters.thisMonth}</option>
        </select>
        <SelectChevron />
      </label>

      <label className="order-filters__select-control">
        <span className="order-filters__label">
          {t.order.filters.orderType}
        </span>
        <svg
          className="order-filters__leading-icon"
          viewBox="0 0 20 20"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M3.75 3A1.75 1.75 0 0 0 2 4.75v3.5C2 9.22 2.78 10 3.75 10h3.5C8.22 10 9 9.22 9 8.25v-3.5C9 3.78 8.22 3 7.25 3h-3.5Zm-.25 1.75c0-.14.11-.25.25-.25h3.5c.14 0 .25.11.25.25v3.5c0 .14-.11.25-.25.25h-3.5a.25.25 0 0 1-.25-.25v-3.5ZM12.75 3C11.78 3 11 3.78 11 4.75v3.5c0 .97.78 1.75 1.75 1.75h3.5C17.22 10 18 9.22 18 8.25v-3.5C18 3.78 17.22 3 16.25 3h-3.5Zm-.25 1.75c0-.14.11-.25.25-.25h3.5c.14 0 .25.11.25.25v3.5c0 .14-.11.25-.25.25h-3.5a.25.25 0 0 1-.25-.25v-3.5ZM3.75 12C2.78 12 2 12.78 2 13.75v2.5C2 17.22 2.78 18 3.75 18h3.5C8.22 18 9 17.22 9 16.25v-2.5C9 12.78 8.22 12 7.25 12h-3.5Zm-.25 1.75c0-.14.11-.25.25-.25h3.5c.14 0 .25.11.25.25v2.5c0 .14-.11.25-.25.25h-3.5a.25.25 0 0 1-.25-.25v-2.5ZM12.75 12c-.97 0-1.75.78-1.75 1.75v2.5c0 .97.78 1.75 1.75 1.75h3.5c.97 0 1.75-.78 1.75-1.75v-2.5c0-.97-.78-1.75-1.75-1.75h-3.5Zm-.25 1.75c0-.14.11-.25.25-.25h3.5c.14 0 .25.11.25.25v2.5c0 .14-.11.25-.25.25h-3.5a.25.25 0 0 1-.25-.25v-2.5Z" />
        </svg>
        <select
          aria-label={t.order.filters.orderType}
          value={orderTypeFilter}
          onChange={(event) =>
            onOrderTypeFilterChange(event.target.value as OrderTypeFilter)
          }
        >
          <option value="all">{t.order.filters.allOrderTypes}</option>
          <option value="boothBooking">{t.order.types.boothBooking}</option>
          <option value="serviceOrder">{t.order.types.serviceOrder}</option>
        </select>
        <SelectChevron />
      </label>
    </div>
  );
}

function SelectChevron() {
  return (
    <svg
      className="order-filters__chevron"
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5.22 7.72a.75.75 0 0 1 1.06 0L10 11.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.78a.75.75 0 0 1 0-1.06Z" />
    </svg>
  );
}
