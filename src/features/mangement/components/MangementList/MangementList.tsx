import type { HallApiData } from "../../types";
import { MangementTableRow } from "../MangementTableRow";
import "./MangementList.scss";

interface MangementListProps {
  halls: HallApiData[];
}

export function MangementList({ halls }: MangementListProps) {
  return (
    <section className="mangement-list" aria-label="Halls and booths">
      {halls.map((hall) => (
        <MangementTableRow key={hall.id} hall={hall} />
      ))}
    </section>
  );
}
