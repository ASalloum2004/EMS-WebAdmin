import { DataTable, type DataTableColumn } from "../../../../components";
import type { HallApiData } from "../../types";

interface ManagementListProps {
  halls: HallApiData[];
}

const hallColumns: Array<DataTableColumn<HallApiData>> = [
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

export function ManagementList({ halls }: ManagementListProps) {
  return (
    <DataTable
      ariaLabel="Halls and booths"
      columns={hallColumns}
      getItemKey={(hall) => hall.id}
      items={halls}
    />
  );
}
