import { useI18n } from "../../../../i18n";
import type { VisitorDateFilter } from "../../types";
import "./VisitorFiltersPanel.scss";

interface VisitorFiltersPanelProps {
  dateFilter: VisitorDateFilter;
  onApply: () => void;
  onChange: (dateFilter: VisitorDateFilter) => void;
  onClear: () => void;
}

export function VisitorFiltersPanel({
  dateFilter,
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
      <label className="visitor-filters-panel__field">
        <span>{t.visitor.filters.date}</span>
        <select
          onChange={(event) =>
            onChange(event.target.value as VisitorDateFilter)
          }
          value={dateFilter}
        >
          <option value="any">{t.visitor.filters.anyTime}</option>
          <option value="today">{t.visitor.filters.today}</option>
          <option value="last7Days">{t.visitor.filters.last7Days}</option>
          <option value="last30Days">{t.visitor.filters.last30Days}</option>
        </select>
      </label>

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
