import { useI18n } from "../../../../i18n";
import type { ReportFilters } from "../../types";
import "./ReportFiltersPanel.scss";

interface ReportFiltersPanelProps {
  filters: ReportFilters;
  onApply: () => void;
  onChange: (filters: ReportFilters) => void;
  onClear: () => void;
}

export function ReportFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
}: ReportFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.reports.filters.panelAriaLabel}
      className="report-filters-panel"
      role="group"
    >
      <div className="report-filters-panel__grid">
        <label className="report-filters-panel__field">
          <span>{t.reports.filters.status}</span>
          <select
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as ReportFilters["status"] })
            }
            value={filters.status}
          >
            <option value="">{t.reports.filters.all}</option>
            <option value="pending">
              {t.reports.reportStatuses.pending}
            </option>
            <option value="resolved">
              {t.reports.reportStatuses.resolved}
            </option>
            <option value="rejected">
              {t.reports.reportStatuses.rejected}
            </option>
          </select>
        </label>
      </div>

      <div className="report-filters-panel__actions">
        <button
          className="report-filters-panel__button report-filters-panel__button--secondary"
          onClick={onClear}
          type="button"
        >
          {t.common.clear}
        </button>
        <button
          className="report-filters-panel__button report-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
