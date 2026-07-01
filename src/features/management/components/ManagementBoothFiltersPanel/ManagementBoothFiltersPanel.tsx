import { useI18n } from "../../../../i18n";
import type { BoothClientFilters } from "../../types";
import "./ManagementBoothFiltersPanel.scss";

interface ManagementBoothFiltersPanelProps {
  filters: BoothClientFilters;
  onApply: () => void;
  onChange: (filters: BoothClientFilters) => void;
  onClear: () => void;
  validationMessage?: string;
}

export function ManagementBoothFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
  validationMessage = "",
}: ManagementBoothFiltersPanelProps) {
  const { t } = useI18n();

  function updateFilter(field: keyof BoothClientFilters, value: string) {
    onChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <div
      className="management-booth-filters-panel"
      role="dialog"
      aria-label={t.management.filters.boothFiltersAriaLabel}
    >
      <div className="management-booth-filters-panel__grid">
        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.boothNumber}</span>
          <input
            type="text"
            placeholder={t.management.booths.number}
            value={filters.number}
            onChange={(event) => updateFilter("number", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.bookingStatus}</span>
          <select
            value={filters.booked}
            onChange={(event) => updateFilter("booked", event.target.value)}
          >
            <option value="">{t.management.filters.all}</option>
            <option value="booked">{t.management.filters.booked}</option>
            <option value="available">{t.management.filters.available}</option>
          </select>
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.minArea}</span>
          <input
            type="number"
            placeholder={t.management.filters.min}
            value={filters.minArea}
            onChange={(event) => updateFilter("minArea", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.maxArea}</span>
          <input
            type="number"
            placeholder={t.management.filters.max}
            value={filters.maxArea}
            onChange={(event) => updateFilter("maxArea", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.minPrice}</span>
          <input
            type="number"
            placeholder={t.management.filters.min}
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.maxPrice}</span>
          <input
            type="number"
            placeholder={t.management.filters.max}
            value={filters.maxPrice}
            onChange={(event) => updateFilter("maxPrice", event.target.value)}
          />
        </label>
      </div>

      {validationMessage ? (
        <p className="management-booth-filters-panel__validation" role="alert">
          {validationMessage}
        </p>
      ) : null}

      <div className="management-booth-filters-panel__actions">
        <button
          className="management-booth-filters-panel__button management-booth-filters-panel__button--secondary"
          type="button"
          onClick={onClear}
        >
          {t.common.clear}
        </button>
        <button
          className="management-booth-filters-panel__button management-booth-filters-panel__button--primary"
          type="button"
          onClick={onApply}
          disabled={Boolean(validationMessage)}
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
