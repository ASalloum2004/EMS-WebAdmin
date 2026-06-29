import { MangementList } from "../components/MangementList";
import { MangementSearchBar } from "../components/MangementSearchBar";
import { MangementHeader } from "../components/MangementHeader";
import { MangementTabs } from "../components/MangementTabs";
import { mockMangementItems } from "../data/mockMangementItems";
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

        <MangementList items={mockMangementItems} />
      </section>
    </div>
  );
}
