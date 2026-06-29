import type { BoothApiData } from "../../types";
import "./ManagementBoothRow.scss";

interface ManagementBoothRowProps {
  booth: BoothApiData;
  onEdit: (booth: BoothApiData) => void;
}

export function ManagementBoothRow({ booth, onEdit }: ManagementBoothRowProps) {
  return (
    <article
      className="management-booth-row"
      aria-labelledby={`booth-${booth.id}-title`}
    >
      <div className="management-booth-row__main">
        <h2 id={`booth-${booth.id}-title`}>{booth.number}</h2>
      </div>

      <div className="management-booth-row__metric">
        <span className="management-booth-row__metric-label">AREA</span>
        <span className="management-booth-row__metric-value">
          {booth.area}
        </span>
      </div>

      <div className="management-booth-row__metric">
        <span className="management-booth-row__metric-label">PRICE</span>
        <span className="management-booth-row__metric-value">
          {booth.price}
        </span>
      </div>

      <span className="management-booth-row__id">#{booth.id}</span>

      <button
        className="management-booth-row__edit"
        type="button"
        onClick={() => onEdit(booth)}
      >
        Edit
      </button>
    </article>
  );
}
