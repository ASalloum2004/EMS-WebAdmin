import type { HallApiData } from "../../types";
import "./ManagementTableRow.scss";

interface ManagementTableRowProps {
  hall: HallApiData;
}

export function ManagementTableRow({ hall }: ManagementTableRowProps) {
  return (
    <article
      className="management-table-row"
      aria-labelledby={`hall-${hall.id}-title`}
    >
      <div className="management-table-row__main">
        <h2 id={`hall-${hall.id}-title`}>{hall.type}</h2>
        <p>{hall.number}</p>
      </div>

      <div className="management-table-row__metric">
        <span className="management-table-row__metric-label">AREA</span>
        <span className="management-table-row__metric-value">
          {hall.area}
        </span>
      </div>

      <span className="management-table-row__id">#{hall.id}</span>
    </article>
  );
}
