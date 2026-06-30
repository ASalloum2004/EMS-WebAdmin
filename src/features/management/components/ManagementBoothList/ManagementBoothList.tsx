import { DataTable, type DataTableColumn } from "../../../../components";
import type { BoothApiData } from "../../types";

interface ManagementBoothListProps {
  booths: BoothApiData[];
  onEditBooth: (booth: BoothApiData) => void;
}

const boothColumns: Array<DataTableColumn<BoothApiData>> = [
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

export function ManagementBoothList({
  booths,
  onEditBooth,
}: ManagementBoothListProps) {
  return (
    <DataTable
      actions={(booth) => (
        <button
          className="data-table__action-button"
          type="button"
          onClick={() => onEditBooth(booth)}
        >
          Edit
        </button>
      )}
      ariaLabel="Booths"
      columns={boothColumns}
      getItemKey={(booth) => booth.id}
      items={booths}
    />
  );
}
