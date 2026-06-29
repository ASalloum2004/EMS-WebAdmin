import { useState } from "react";
import "./MangementSearchBar.scss";

export function MangementSearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="mangement-search-bar">
      <label className="mangement-search-bar__label" htmlFor="mangement-search">
        Search halls
      </label>
      <input
        id="mangement-search"
        className="mangement-search-bar__input"
        type="search"
        placeholder="Search halls..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
    </div>
  );
}
