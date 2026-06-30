import type { DataTableColumn } from "../../../components";
import type { BoothApiData, HallApiData } from "../types";

export const hallColumns: Array<DataTableColumn<HallApiData>> = [
  {
    key: "type",
    label: "Type",
    render: (hall) => hall.type,
    supportingText: (hall) => hall.number,
    variant: "primary",
  },
  {
    key: "area",
    label: "Area",
    render: (hall) => hall.area,
    variant: "metric",
  },
  {
    key: "id",
    label: "ID",
    render: (hall) => `#${hall.id}`,
    variant: "badge",
  },
];

export const boothColumns: Array<DataTableColumn<BoothApiData>> = [
  {
    key: "number",
    label: "Number",
    render: (booth) => booth.number,
    variant: "primary",
  },
  {
    key: "area",
    label: "Area",
    render: (booth) => booth.area,
    variant: "metric",
  },
  {
    key: "price",
    label: "Price",
    render: (booth) => booth.price,
    variant: "metric",
  },
  {
    key: "id",
    label: "ID",
    render: (booth) => `#${booth.id}`,
    variant: "badge",
  },
];

export function getBoothActions(onEditBooth: (booth: BoothApiData) => void) {
  return (booth: BoothApiData) => (
    <button
      className="data-table__action-button"
      type="button"
      onClick={() => onEditBooth(booth)}
    >
      Edit
    </button>
  );
}
