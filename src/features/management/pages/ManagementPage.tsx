import { useMemo, useState } from "react";
import { ManagementList } from "../components/ManagementList";
import { ManagementSearchBar } from "../components/ManagementSearchBar";
import { ManagementHeader } from "../components/ManagementHeader";
import { ManagementTabs } from "../components/ManagementTabs";
import { useHalls } from "../hooks";
import "./ManagementPage.scss";

export function ManagementPage() {
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
    <div className="management-page">
      <ManagementHeader
        title="Halls & Booth Management"
        description="Descripton"
        actionLabel="Services"
      />

      <section className="management-page__panel" aria-label="Management list">
        <div className="management-page__controls">
          <div className="management-page__filters">
            <ManagementTabs />
          </div>

          <div className="management-page__search">
            <ManagementSearchBar
              value={searchValue}
              onChange={setSearchValue}
            />
          </div>
        </div>

        <div className="management-page__divider" />

        {isLoading ? (
          <p className="management-page__state">Loading halls...</p>
        ) : null}

        {!isLoading && error ? (
          <div className="management-page__state" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && !hasHalls ? (
          <p className="management-page__state">No halls found.</p>
        ) : null}

        {!isLoading && !error && hasHalls ? (
          <ManagementList halls={filteredHalls} />
        ) : null}
      </section>
    </div>
  );
}
