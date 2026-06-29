import { MangementList } from "../components/MangementList";
import { MangementSearchBar } from "../components/MangementSearchBar";
import { MangementHeader } from "../components/MangementHeader";
import { MangementTabs } from "../components/MangementTabs";
import { useHalls } from "../hooks";
import "./MangementPage.scss";

export function MangementPage() {
  const { error, halls, isLoading, refetch } = useHalls();
  const hasHalls = halls.length > 0;

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

        {isLoading ? (
          <p className="mangement-page__state">Loading halls...</p>
        ) : null}

        {!isLoading && error ? (
          <div className="mangement-page__state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && !hasHalls ? (
          <p className="mangement-page__state">No halls found.</p>
        ) : null}

        {!isLoading && !error && hasHalls ? (
          <MangementList halls={halls} />
        ) : null}
      </section>
    </div>
  );
}
