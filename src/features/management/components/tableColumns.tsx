import type { DataTableColumn } from "../../../components";
import type { I18nDictionary } from "../../../i18n";
import type { BoothApiData, HallApiData } from "../types";

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
      label: t.management.booths.area,
      render: (booth) => booth.area,
      variant: "metric",
    },
    {
      key: "price",
      label: t.management.booths.price,
      render: (booth) => booth.price,
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
