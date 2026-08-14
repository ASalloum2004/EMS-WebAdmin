import type { DataTableColumn } from "../../../components";
import type { I18nDictionary } from "../../../i18n";
import type { BoothApiData, EventHall, HallApiData } from "../types";

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
  ];
}

export function getEventHallColumns(
  t: I18nDictionary,
): Array<DataTableColumn<EventHall>> {
  return [
    {
      key: "number",
      label: t.management.eventHalls.number,
      render: (eventHall) => eventHall.number,
      variant: "primary",
    },
    {
      key: "area",
      label: t.management.eventHalls.area,
      render: (eventHall) => eventHall.area,
      variant: "metric",
    },
    {
      key: "pricePerHour",
      label: t.management.eventHalls.pricePerHour,
      render: (eventHall) => eventHall.price_per_hour,
      variant: "metric",
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

export function getEventHallActions(
  onEditEventHall: (eventHall: EventHall) => void,
  editLabel: string,
) {
  return (eventHall: EventHall) => (
    <button
      className="data-table__action-button"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onEditEventHall(eventHall);
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {editLabel}
    </button>
  );
}
