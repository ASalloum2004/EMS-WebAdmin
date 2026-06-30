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
      aria-label="Booth filters"
    >
      <div className="management-booth-filters-panel__grid">
        <label className="management-booth-filters-panel__field">
          <span>Booth Number</span>
          <input
            type="text"
            placeholder="Number"
            value={filters.number}
            onChange={(event) => updateFilter("number", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>Booking Status</span>
          <select
            value={filters.booked}
            onChange={(event) => updateFilter("booked", event.target.value)}
          >
            <option value="">All</option>
            <option value="booked">Booked</option>
            <option value="available">Available</option>
          </select>
        </label>

        <label className="management-booth-filters-panel__field">
          <span>Minimum Area</span>
          <input
            type="number"
            placeholder="Min"
            value={filters.minArea}
            onChange={(event) => updateFilter("minArea", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>Maximum Area</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxArea}
            onChange={(event) => updateFilter("maxArea", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>Minimum Price</span>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(event) => updateFilter("minPrice", event.target.value)}
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>Maximum Price</span>
          <input
            type="number"
            placeholder="Max"
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
          Clear
        </button>
        <button
          className="management-booth-filters-panel__button management-booth-filters-panel__button--primary"
          type="button"
          onClick={onApply}
          disabled={Boolean(validationMessage)}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
