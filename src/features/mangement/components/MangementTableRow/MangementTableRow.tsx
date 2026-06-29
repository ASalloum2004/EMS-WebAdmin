import type { MangementItem, MangementItemStatus } from "../../types";
import "./MangementTableRow.scss";

interface MangementTableRowProps {
  item: MangementItem;
  isHighlighted?: boolean;
}

function getStatusClass(status: MangementItemStatus) {
  return status === "Available"
    ? "mangement-table-row__status--available"
    : "mangement-table-row__status--booked";
}

export function MangementTableRow({
  isHighlighted = false,
  item,
}: MangementTableRowProps) {
  return (
    <article
      className={
        isHighlighted
          ? "mangement-table-row mangement-table-row--highlighted"
          : "mangement-table-row"
      }
      aria-labelledby={`${item.id}-title`}
    >
      <div className="mangement-table-row__main">
        <h2 id={`${item.id}-title`}>{item.title}</h2>
        <p>{item.description}</p>
      </div>

      <div className="mangement-table-row__capacity">
        <span className="mangement-table-row__capacity-label">
          {item.capacityLabel}
        </span>
        <span className="mangement-table-row__capacity-value">
          {item.capacity}
        </span>
      </div>

      <span
        className={`mangement-table-row__status ${getStatusClass(
          item.status,
        )}`}
      >
        {item.status}
      </span>

      <button
        className="mangement-table-row__menu-button"
        type="button"
        aria-label={`More actions for ${item.title}`}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </article>
  );
}
