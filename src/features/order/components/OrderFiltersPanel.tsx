import { useI18n } from "../../../i18n";
import type { BoothRequestFilters } from "../types";
import "./OrderFiltersPanel.scss";

interface OrderFiltersPanelProps {
  filters: BoothRequestFilters;
  onApply: () => void;
  onChange: (filters: BoothRequestFilters) => void;
  onClear: () => void;
}

export function OrderFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
}: OrderFiltersPanelProps) {
  const { t } = useI18n();

  function updateFilter(
    field: keyof BoothRequestFilters,
    value: string,
  ) {
    onChange({
      ...filters,
      [field]: value,
    } as BoothRequestFilters);
  }

  return (
    <div
      aria-label={t.order.filters.panelAriaLabel}
      className="order-filters-panel"
      role="dialog"
    >
      <div className="order-filters-panel__grid">
        <label className="order-filters-panel__field">
          <span>{t.order.filters.status}</span>
          <select
            onChange={(event) =>
              updateFilter("status", event.target.value)
            }
            value={filters.status}
          >
            <option value="">{t.order.filters.allStatuses}</option>
            <option value="pending">{t.order.status.pending}</option>
            <option value="approved">{t.order.status.approved}</option>
            <option value="rejected">{t.order.status.rejected}</option>
          </select>
        </label>

        <label className="order-filters-panel__field">
          <span>{t.order.filters.createdDate}</span>
          <input
            onChange={(event) =>
              updateFilter("createdDate", event.target.value)
            }
            type="date"
            value={filters.createdDate}
          />
        </label>

        <label className="order-filters-panel__field">
          <span>{t.order.filters.sort}</span>
          <select
            onChange={(event) => updateFilter("sort", event.target.value)}
            value={filters.sort}
          >
            <option value="">{t.order.filters.defaultSort}</option>
            <option value="-created_at">
              {t.order.filters.newestFirst}
            </option>
            <option value="created_at">
              {t.order.filters.oldestFirst}
            </option>
          </select>
        </label>
      </div>

      <div className="order-filters-panel__actions">
        <button
          className="order-filters-panel__button order-filters-panel__button--secondary"
          onClick={onClear}
          type="button"
        >
          {t.common.clear}
        </button>
        <button
          className="order-filters-panel__button order-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
