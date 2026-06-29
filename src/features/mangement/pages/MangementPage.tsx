import { MangementList } from "../components/MangementList";
import { MangementPagination } from "../components/MangementPagination";
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
          <MangementTabs />
          <MangementSearchBar />
        </div>

        <div className="mangement-page__divider" />

        <MangementList items={mockMangementItems} />

        <MangementPagination />
      </section>
    </div>
  );
}
