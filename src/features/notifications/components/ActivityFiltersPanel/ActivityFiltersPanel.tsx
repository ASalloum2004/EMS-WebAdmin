import { useI18n } from "../../../../i18n";
import type { ActivityFilterValues } from "../../types";
import "./ActivityFiltersPanel.scss";

export type ActivityFilterOption = {
  label: string;
  value: string;
};

type ActivityFiltersPanelProps = {
  ariaLabel: string;
  filters: ActivityFilterValues;
  onApply: () => void;
  onChange: (filters: ActivityFilterValues) => void;
  onReset: () => void;
  statusOptions: ActivityFilterOption[];
  typeOptions: ActivityFilterOption[];
};

export function ActivityFiltersPanel({
  ariaLabel,
  filters,
  onApply,
  onChange,
  onReset,
  statusOptions,
  typeOptions,
}: ActivityFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={ariaLabel}
      className="activity-filters-panel"
      role="group"
    >
      <div className="activity-filters-panel__grid">
        <label className="activity-filters-panel__field">
          <span>{t.notifications.filters.status}</span>
          <select
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value })
            }
            value={filters.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="activity-filters-panel__field">
          <span>{t.notifications.filters.type}</span>
          <select
            onChange={(event) =>
              onChange({ ...filters, type: event.target.value })
            }
            value={filters.type}
          >
            {typeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="activity-filters-panel__actions">
        <button
          className="activity-filters-panel__button activity-filters-panel__button--secondary"
          onClick={onReset}
          type="button"
        >
          {t.notifications.filters.reset}
        </button>
        <button
          className="activity-filters-panel__button activity-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
