import { useI18n } from "../../../../i18n";
import type { CompanyFilters } from "../../types";
import "./CompanyFiltersPanel.scss";

type CompanyFiltersPanelProps = {
  filters: CompanyFilters;
  onApply: () => void;
  onChange: (filters: CompanyFilters) => void;
  onClear: () => void;
};

export function CompanyFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
}: CompanyFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.company.filters.panelAriaLabel}
      className="company-filters-panel"
      role="group"
    >
      <div className="company-filters-panel__grid">
        <label className="company-filters-panel__field">
          <span>{t.company.filters.businessSector}</span>
          <input
            onChange={(event) =>
              onChange({
                ...filters,
                businessSector: event.target.value,
              })
            }
            placeholder={t.company.filters.businessSectorPlaceholder}
            type="text"
            value={filters.businessSector}
          />
        </label>

        <label className="company-filters-panel__field">
          <span>{t.company.filters.status}</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as CompanyFilters["status"],
              })
            }
            value={filters.status}
          >
            <option value="">{t.company.filters.allStatuses}</option>
            <option value="approved">{t.company.statuses.approved}</option>
            <option value="pending">{t.company.statuses.pending}</option>
            <option value="rejected">{t.company.statuses.rejected}</option>
          </select>
        </label>
      </div>

      <div className="company-filters-panel__actions">
        <button
          className="company-filters-panel__button company-filters-panel__button--secondary"
          onClick={onClear}
          type="button"
        >
          {t.common.clear}
        </button>
        <button
          className="company-filters-panel__button company-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
