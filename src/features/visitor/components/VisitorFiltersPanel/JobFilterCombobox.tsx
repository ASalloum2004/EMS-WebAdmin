import { useMemo, useState } from "react";
import { useI18n } from "../../../../i18n";
import { businessSectors, type BusinessSector } from "../../data";
import "./JobFilterCombobox.scss";

interface JobFilterComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobFilterCombobox({ value, onChange }: JobFilterComboboxProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSector = businessSectors.find((sector) => sector === value);
  const selectedLabel = selectedSector
    ? t.visitor.filters.businessSectors[selectedSector]
    : value;
  const normalizedQuery = query.trim().toLowerCase();
  const matchingSectors = useMemo(
    () =>
      businessSectors.filter((sector) =>
        t.visitor.filters.businessSectors[sector]
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery, t.visitor.filters.businessSectors],
  );

  function openMenu() {
    setQuery("");
    setIsOpen(true);
  }

  function closeMenu() {
    setIsOpen(false);
    setQuery("");
  }

  function selectSector(sector: BusinessSector | "") {
    onChange(sector);
    closeMenu();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (event.key === "ArrowDown") {
      setIsOpen(true);
      return;
    }

    if (event.key === "Enter" && matchingSectors.length === 1) {
      event.preventDefault();
      selectSector(matchingSectors[0]);
    }
  }

  return (
    <div className="job-filter-combobox">
      <input
        aria-autocomplete="list"
        aria-controls="job-filter-options"
        aria-expanded={isOpen}
        className="job-filter-combobox__input"
        onBlur={closeMenu}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={openMenu}
        onKeyDown={handleKeyDown}
        placeholder={
          isOpen
            ? t.visitor.filters.jobSearchPlaceholder
            : t.visitor.filters.allJobs
        }
        role="combobox"
        type="text"
        value={isOpen ? query : selectedLabel}
      />

      {isOpen && (
        <div
          aria-label={t.visitor.filters.job}
          className="job-filter-combobox__menu"
          id="job-filter-options"
          role="listbox"
        >
          <button
            aria-selected={value === ""}
            className="job-filter-combobox__option"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => selectSector("")}
            role="option"
            type="button"
          >
            {t.visitor.filters.allJobs}
          </button>
          {matchingSectors.map((sector) => (
            <button
              aria-selected={value === sector}
              className="job-filter-combobox__option"
              key={sector}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSector(sector)}
              role="option"
              type="button"
            >
              {t.visitor.filters.businessSectors[sector]}
            </button>
          ))}
          {matchingSectors.length === 0 && (
            <p className="job-filter-combobox__empty">
              {t.visitor.filters.noMatchingJobs}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
