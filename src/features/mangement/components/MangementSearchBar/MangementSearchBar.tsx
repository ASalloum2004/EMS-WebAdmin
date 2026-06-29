import { useState } from "react";
import "./MangementSearchBar.scss";

export function MangementSearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="mangement-search-bar">
      <label className="mangement-search-bar__label" htmlFor="mangement-search">
        Search halls
      </label>
      <span className="mangement-search-bar__search-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" focusable="false">
          <path d="M8.75 3.5a5.25 5.25 0 1 0 0 10.5 5.25 5.25 0 0 0 0-10.5ZM2 8.75a6.75 6.75 0 1 1 12.13 4.07l3.03 3.02a.75.75 0 0 1-1.06 1.06l-3.02-3.03A6.75 6.75 0 0 1 2 8.75Z" />
        </svg>
      </span>
      <input
        id="mangement-search"
        className="mangement-search-bar__input"
        type="search"
        placeholder="Search halls..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button
        className="mangement-search-bar__filter-button"
        type="button"
        aria-label="Open filters"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M3.25 4.5A.75.75 0 0 1 4 3.75h12a.75.75 0 0 1 .57 1.24l-4.82 5.62v3.64a.75.75 0 0 1-.38.65l-2.5 1.42a.75.75 0 0 1-1.12-.65v-5.06L3.43 4.99a.75.75 0 0 1-.18-.49Zm2.38.75 3.45 4.01c.11.14.17.31.17.49v4.63l1-.57V9.75c0-.18.06-.35.17-.49l3.95-4.01H5.63Z" />
        </svg>
        <span>Filter</span>
      </button>
    </div>
  );
}
