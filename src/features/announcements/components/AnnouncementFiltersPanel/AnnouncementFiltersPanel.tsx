import { useI18n } from "../../../../i18n";
import type {
  AnnouncementDraftFilter,
  AnnouncementFilters,
  AnnouncementFormReceiver,
} from "../../types";
import "./AnnouncementFiltersPanel.scss";

interface AnnouncementFiltersPanelProps {
  filters: AnnouncementFilters;
  onApply: () => void;
  onChange: (filters: AnnouncementFilters) => void;
  onClear: () => void;
}

export function AnnouncementFiltersPanel({
  filters,
  onApply,
  onChange,
  onClear,
}: AnnouncementFiltersPanelProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t.announcements.filters.panelAriaLabel}
      className="announcement-filters-panel"
      role="group"
    >
      <div className="announcement-filters-panel__grid">
        <label className="announcement-filters-panel__field">
          <span>{t.announcements.fields.receiver}</span>
          <select
            value={filters.receiver}
            onChange={(event) =>
              onChange({
                ...filters,
                receiver: event.target.value as
                  | ""
                  | AnnouncementFormReceiver,
              })
            }
          >
            <option value="">{t.announcements.filters.allReceivers}</option>
            <option value="exhibitors">
              {t.announcements.audience.exhibitors}
            </option>
            <option value="visitors">
              {t.announcements.audience.visitors}
            </option>
            <option value="all">{t.announcements.audience.all}</option>
          </select>
        </label>

        <label className="announcement-filters-panel__field">
          <span>{t.announcements.filters.publicationState}</span>
          <select
            value={filters.draftStatus}
            onChange={(event) =>
              onChange({
                ...filters,
                draftStatus: event.target.value as AnnouncementDraftFilter,
              })
            }
          >
            <option value="">{t.announcements.filters.allStates}</option>
            <option value="draft">{t.announcements.status.draft}</option>
            <option value="published">
              {t.announcements.status.published}
            </option>
          </select>
        </label>
      </div>

      <div className="announcement-filters-panel__actions">
        <button
          className="announcement-filters-panel__button announcement-filters-panel__button--secondary"
          onClick={onClear}
          type="button"
        >
          {t.common.clear}
        </button>
        <button
          className="announcement-filters-panel__button announcement-filters-panel__button--primary"
          onClick={onApply}
          type="button"
        >
          {t.common.apply}
        </button>
      </div>
    </div>
  );
}
