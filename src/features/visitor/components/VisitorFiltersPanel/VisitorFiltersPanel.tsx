import { useI18n } from "../../../../i18n";
import { JobFilterCombobox } from "./JobFilterCombobox";
import type {

  VisitorFilters,
  VisitorGenderFilter,
} from "../../types";
import "./VisitorFiltersPanel.scss";

interface VisitorFiltersPanelProps {
  filters: VisitorFilters;
  onApply: () => void;
  onChange: (filters: VisitorFilters) => void;
  onClear: () => void;
}

export function VisitorFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
}: VisitorFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.visitor.filters.panelAriaLabel}
      className="visitor-filters-panel"
      role="group"
    >
      <div className="visitor-filters-panel__grid">
        <label className="visitor-filters-panel__field">
          <span>{t.visitor.filters.gender}</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                gender: event.target.value as VisitorGenderFilter,
              })
            }
            value={filters.gender}
          >
            <option value="">{t.visitor.filters.allGenders}</option>
            <option value="female">{t.visitor.table.genders.female}</option>
            <option value="male">{t.visitor.table.genders.male}</option>
          </select>
        </label>

        <label className="visitor-filters-panel__field">
          <span>{t.visitor.filters.job}</span>
          <JobFilterCombobox
            onChange={(job) => onChange({ ...filters, job })}
            value={filters.job}
          />
        </label>

        <label className="visitor-filters-panel__field">
          <span>{t.visitor.filters.location}</span>
          <input
            onChange={(event) =>
              onChange({ ...filters, location: event.target.value })
            }
            placeholder={t.visitor.filters.locationPlaceholder}
            type="text"
            value={filters.location}
          />
        </label>
      </div>

      <div className="visitor-filters-panel__actions">
        <button
          className="visitor-filters-panel__button visitor-filters-panel__button--secondary"
          onClick={onClear}
          type="button"
        >
          {t.common.clear}
        </button>
        <button
          className="visitor-filters-panel__button visitor-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
