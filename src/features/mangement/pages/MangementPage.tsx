import { useMemo, useState } from "react";
import { MangementList } from "../components/MangementList";
import { MangementSearchBar } from "../components/MangementSearchBar";
import { MangementHeader } from "../components/MangementHeader";
import { MangementTabs } from "../components/MangementTabs";
import { useHalls } from "../hooks";
import "./MangementPage.scss";

export function MangementPage() {
  const { error, halls, isLoading, refetch } = useHalls();
  const [searchValue, setSearchValue] = useState("");
  const filteredHalls = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return halls;
    }

    return halls.filter((hall) => {
      return (
        String(hall.id).includes(normalizedSearch) ||
        hall.number.toLowerCase().includes(normalizedSearch) ||
        hall.type.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [halls, searchValue]);
  const hasHalls = filteredHalls.length > 0;

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
            <MangementSearchBar
              value={searchValue}
              onChange={setSearchValue}
            />
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
          <MangementList halls={filteredHalls} />
        ) : null}
      </section>
    </div>
  );
}
