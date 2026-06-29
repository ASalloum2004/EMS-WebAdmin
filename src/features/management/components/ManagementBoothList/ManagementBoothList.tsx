import type { BoothApiData } from "../../types";
import { ManagementBoothRow } from "../ManagementBoothRow";
import "./ManagementBoothList.scss";

interface ManagementBoothListProps {
  booths: BoothApiData[];
  onEditBooth: (booth: BoothApiData) => void;
}

export function ManagementBoothList({
  booths,
  onEditBooth,
}: ManagementBoothListProps) {
  return (
    <section className="management-booth-list" aria-label="Booths">
      {booths.map((booth) => (
        <ManagementBoothRow
          key={booth.id}
          booth={booth}
          onEdit={onEditBooth}
        />
      ))}
    </section>
  );
}
