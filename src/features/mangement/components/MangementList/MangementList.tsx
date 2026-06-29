import type { MangementItem } from "../../types";
import { MangementTableRow } from "../MangementTableRow";
import "./MangementList.scss";

interface MangementListProps {
  items: MangementItem[];
}

export function MangementList({ items }: MangementListProps) {
  return (
    <section className="mangement-list" aria-label="Halls and booths">
      {items.map((item, index) => (
        <MangementTableRow
          key={item.id}
          item={item}
          isHighlighted={index === 0}
        />
      ))}
      
    </section>
  );
}
