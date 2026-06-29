import { MangementList } from "../components/MangementList";
import { MangementSearchBar } from "../components/MangementSearchBar";
import { MangementHeader } from "../components/MangementHeader";
import { MangementTabs } from "../components/MangementTabs";
import { mockHalls } from "../data/mockHalls";
import "./MangementPage.scss";

export function MangementPage() {
  return (
    <div className="mangement-page">
      <MangementHeader
        title="Halls & Booth Mangements"
        description="Descripton"
        actionLabel="Services"
      />

      <section className="mangement-page__panel" aria-label="Mangement list">
        <div className="mangement-page__controls">
          <div className="mangement-page__filters">
            <MangementTabs />
          </div>

          <div className="mangement-page__search">
            <MangementSearchBar />
          </div>
        </div>

        <div className="mangement-page__divider" />

        <MangementList halls={mockHalls} />
      </section>
    </div>
  );
}
