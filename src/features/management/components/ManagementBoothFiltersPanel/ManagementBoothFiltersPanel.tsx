import { useI18n } from "../../../../i18n";
import type {
  BoothClientFilters,
  EventHallClientFilters,
} from "../../types";
import "./ManagementBoothFiltersPanel.scss";

type SharedFilterPanelProps = {
  onApply: () => void;
  onClear: () => void;
  validationMessage?: string;
};

type BoothFiltersPanelProps = SharedFilterPanelProps & {
  filters: BoothClientFilters;
  onChange: (filters: BoothClientFilters) => void;
  mode?: "booth";
};

type EventHallFiltersPanelProps = SharedFilterPanelProps & {
  filters: EventHallClientFilters;
  onChange: (filters: EventHallClientFilters) => void;
  mode: "eventHall";
};

type ManagementBoothFiltersPanelProps =
  | BoothFiltersPanelProps
  | EventHallFiltersPanelProps;

export function ManagementBoothFiltersPanel(
  props: ManagementBoothFiltersPanelProps,
) {
  const { t } = useI18n();
  const { filters, onApply, onClear, validationMessage = "" } = props;
  const isEventHallMode = props.mode === "eventHall";

  function updateRangeFilter(
    field: keyof EventHallClientFilters,
    value: string,
  ) {
    if (props.mode === "eventHall") {
      props.onChange({
        ...props.filters,
        [field]: value,
      });
      return;
    }

    props.onChange({
      ...props.filters,
      [field]: value,
    });
  }

  function updateBoothFilter(
    field: "booked" | "number",
    value: string,
  ) {
    if (props.mode === "eventHall") {
      return;
    }

    props.onChange({
      ...props.filters,
      [field]: value,
    });
  }

  return (
    <div
      className="management-booth-filters-panel"
      role="dialog"
      aria-label={
        isEventHallMode
          ? t.management.filters.eventHallFiltersAriaLabel
          : t.management.filters.boothFiltersAriaLabel
      }
    >
      <div className="management-booth-filters-panel__grid">
        {!isEventHallMode && "number" in filters && "booked" in filters ? (
          <>
            <label className="management-booth-filters-panel__field">
              <span>{t.management.filters.boothNumber}</span>
              <input
                type="text"
                placeholder={t.management.booths.number}
                value={filters.number}
                onChange={(event) =>
                  updateBoothFilter("number", event.target.value)
                }
              />
            </label>

            <label className="management-booth-filters-panel__field">
              <span>{t.management.filters.bookingStatus}</span>
              <select
                value={filters.booked}
                onChange={(event) =>
                  updateBoothFilter("booked", event.target.value)
                }
              >
                <option value="">{t.management.filters.all}</option>
                <option value="booked">{t.management.filters.booked}</option>
                <option value="available">
                  {t.management.filters.available}
                </option>
              </select>
            </label>
          </>
        ) : null}

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.minArea}</span>
          <input
            type="number"
            placeholder={t.management.filters.min}
            value={filters.minArea}
            onChange={(event) =>
              updateRangeFilter("minArea", event.target.value)
            }
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.maxArea}</span>
          <input
            type="number"
            placeholder={t.management.filters.max}
            value={filters.maxArea}
            onChange={(event) =>
              updateRangeFilter("maxArea", event.target.value)
            }
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.minPrice}</span>
          <input
            type="number"
            placeholder={t.management.filters.min}
            value={filters.minPrice}
            onChange={(event) =>
              updateRangeFilter("minPrice", event.target.value)
            }
          />
        </label>

        <label className="management-booth-filters-panel__field">
          <span>{t.management.filters.maxPrice}</span>
          <input
            type="number"
            placeholder={t.management.filters.max}
            value={filters.maxPrice}
            onChange={(event) =>
              updateRangeFilter("maxPrice", event.target.value)
            }
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
