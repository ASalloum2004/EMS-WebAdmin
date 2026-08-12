import { useI18n } from "../../../../i18n";
import type { NotificationFilters } from "../../types";
import "./NotificationFiltersPanel.scss";

export type NotificationFilterOption = {
  label: string;
  value: string;
};

type NotificationFiltersPanelProps = {
  filters: NotificationFilters;
  onApply: () => void;
  onChange: (filters: NotificationFilters) => void;
  onReset: () => void;
  statusOptions: NotificationFilterOption[];
  typeOptions: NotificationFilterOption[];
};

export function NotificationFiltersPanel({
  filters,
  onApply,
  onChange,
  onReset,
  statusOptions,
  typeOptions,
}: NotificationFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.notifications.filters.panelAriaLabel}
      className="notification-filters-panel"
      role="group"
    >
      <div className="notification-filters-panel__grid">
        <label className="notification-filters-panel__field">
          <span>{t.notifications.filters.status}</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as NotificationFilters["status"],
              })
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

        <label className="notification-filters-panel__field">
          <span>{t.notifications.filters.type}</span>
          <select
            onChange={(event) =>
              onChange({
                ...filters,
                type: event.target.value as NotificationFilters["type"],
              })
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

      <div className="notification-filters-panel__actions">
        <button
          className="notification-filters-panel__button notification-filters-panel__button--secondary"
          onClick={onReset}
          type="button"
        >
          {t.notifications.filters.reset}
        </button>
        <button
          className="notification-filters-panel__button notification-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
