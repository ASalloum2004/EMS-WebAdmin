import { useI18n } from "../../../../i18n";
import "./ManagementFiltersPanel.scss";

export type HallClientFilters = {
  maxArea: string;
  minArea: string;
  type: string;
};

interface ManagementFiltersPanelProps {
  filters: HallClientFilters;
  onApply: () => void;
  onChange: (filters: HallClientFilters) => void;
  onClear: () => void;
  typeOptions: string[];
  validationMessage?: string;
}

function normalizeAreaValue(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function ManagementFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
  typeOptions,
  validationMessage = "",
}: ManagementFiltersPanelProps) {
  const { t } = useI18n();

  function updateFilter(field: keyof HallClientFilters, value: string) {
    onChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <div
      className="management-filters-panel"
      role="dialog"
      aria-label={t.management.filters.hallFiltersAriaLabel}
    >
      <div className="management-filters-panel__grid">
        <label className="management-filters-panel__field">
          <span>{t.management.filters.type}</span>
          <select
            value={filters.type}
            onChange={(event) => updateFilter("type", event.target.value)}
          >
            <option value="">{t.management.filters.allTypes}</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="management-filters-panel__field">
          <span>{t.management.filters.minArea}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t.management.filters.min}
            value={filters.minArea}
            onChange={(event) =>
              updateFilter("minArea", normalizeAreaValue(event.target.value))
            }
          />
        </label>

        <label className="management-filters-panel__field">
          <span>{t.management.filters.maxArea}</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t.management.filters.max}
            value={filters.maxArea}
            onChange={(event) =>
              updateFilter("maxArea", normalizeAreaValue(event.target.value))
            }
          />
        </label>
      </div>

      {validationMessage ? (
        <p className="management-filters-panel__validation" role="alert">
          {validationMessage}
        </p>
      ) : null}

      <div className="management-filters-panel__actions">
        <button
          className="management-filters-panel__button management-filters-panel__button--secondary"
          type="button"
          onClick={onClear}
        >
          {t.common.clear}
        </button>
        <button
          className="management-filters-panel__button management-filters-panel__button--primary"
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
