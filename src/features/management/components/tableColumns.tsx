import type { DataTableColumn } from "../../../components";
import type { I18nDictionary } from "../../../i18n";
import type { BoothApiData, HallApiData } from "../types";

function getBoothBookingStatus(
  booth: BoothApiData,
  status: I18nDictionary["management"]["booths"]["status"],
) {
  return booth.is_booked ? status.booked : status.available;
}

function renderBoothBookingStatus(
  booth: BoothApiData,
  status: I18nDictionary["management"]["booths"]["status"],
) {
  const statusClassName = booth.is_booked
    ? "management-booth-status management-booth-status--booked"
    : "management-booth-status management-booth-status--available";

  return (
    <span className={statusClassName}>
      {getBoothBookingStatus(booth, status)}
    </span>
  );
}

export function getHallColumns(
  t: I18nDictionary,
): Array<DataTableColumn<HallApiData>> {
  return [
    {
      key: "type",
      label: t.management.filters.type,
      render: (hall) => hall.type,
      supportingText: (hall) => hall.number,
      variant: "primary",
    },
    {
      key: "area",
      label: t.management.booths.area,
      render: (hall) => hall.area,
      variant: "metric",
    },
    {
      key: "id",
      label: t.management.table.id,
      render: (hall) => `#${hall.id}`,
      variant: "badge",
    },
  ];
}

export function getBoothColumns(
  t: I18nDictionary,
): Array<DataTableColumn<BoothApiData>> {
  return [
    {
      key: "number",
      label: t.management.booths.number,
      render: (booth) => booth.number,
      variant: "primary",
    },
    {
      key: "area",
      className: "management-booth-table__cell--balanced",
      label: t.management.booths.area,
      render: (booth) => booth.area,
      variant: "metric",
    },
    {
      key: "price",
      className: "management-booth-table__cell--balanced",
      label: t.management.booths.price,
      render: (booth) => booth.price,
      variant: "metric",
    },
    {
      key: "status",
      className: "management-booth-table__cell--balanced",
      label: t.management.booths.status.label,
      render: (booth) =>
        renderBoothBookingStatus(booth, t.management.booths.status),
      variant: "metric",
    },
    {
      key: "id",
      label: t.management.table.id,
      render: (booth) => `#${booth.id}`,
      variant: "badge",
    },
  ];
}

export function getBoothActions(
  onEditBooth: (booth: BoothApiData) => void,
  editLabel: string,
) {
  return (booth: BoothApiData) => (
    <button
      className="data-table__action-button"
      type="button"
      onClick={() => onEditBooth(booth)}
    >
      {editLabel}
    </button>
  );
}
