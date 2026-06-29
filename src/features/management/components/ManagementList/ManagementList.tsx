import type { HallApiData } from "../../types";
import { ManagementTableRow } from "../ManagementTableRow";
import "./ManagementList.scss";

interface ManagementListProps {
  halls: HallApiData[];
}

export function ManagementList({ halls }: ManagementListProps) {
  return (
    <section className="management-list" aria-label="Halls and booths">
      {halls.map((hall) => (
        <ManagementTableRow key={hall.id} hall={hall} />
      ))}
    </section>
  );
}
