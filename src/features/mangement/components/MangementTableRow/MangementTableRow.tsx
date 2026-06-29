import type { HallApiData } from "../../types";
import "./MangementTableRow.scss";

interface MangementTableRowProps {
  hall: HallApiData;
}

export function MangementTableRow({ hall }: MangementTableRowProps) {
  return (
    <article
      className="mangement-table-row"
      aria-labelledby={`hall-${hall.id}-title`}
    >
      <div className="mangement-table-row__main">
        <h2 id={`hall-${hall.id}-title`}>{hall.type}</h2>
        <p>{hall.number}</p>
      </div>

      <div className="mangement-table-row__metric">
        <span className="mangement-table-row__metric-label">AREA</span>
        <span className="mangement-table-row__metric-value">
          {hall.area}
        </span>
      </div>

      <span className="mangement-table-row__id">#{hall.id}</span>
    </article>
  );
}
