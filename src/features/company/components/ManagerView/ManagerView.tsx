import { useMemo, useState } from "react";
import {
  SearchFilterBar,
  TableFooter,
  filterBySearchQuery,
} from "../../../../components";
import { useI18n } from "../../../../i18n";
import { MANAGERS_PER_PAGE, MOCK_MANAGERS } from "../../data";
import type { Manager } from "../../types";
import { ManagerDetailsModal } from "../ManagerDetailsModal";
import { ManagerTable } from "../ManagerTable";
import "./ManagerView.scss";

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.min(Math.max(1, Math.trunc(page)), totalPages);
}

export function ManagerView() {
  const { t } = useI18n();
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const filteredManagers = useMemo(
    () =>
      filterBySearchQuery(MOCK_MANAGERS, searchValue, (manager) => [
        manager.name,
      ]),
    [searchValue],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredManagers.length / MANAGERS_PER_PAGE),
  );
  const activePage = clampPage(currentPage, totalPages);
  const pageStart = (activePage - 1) * MANAGERS_PER_PAGE;
  const visibleManagers = filteredManagers.slice(
    pageStart,
    pageStart + MANAGERS_PER_PAGE,
  );
  const emptyMessage = searchValue.trim()
    ? t.company.manager.table.noResults
    : t.company.manager.table.empty;

  function handleSearchChange(value: string) {
    setSearchValue(value);
    setCurrentPage(1);
    setSelectedManager(null);
  }

  function handlePageChange(page: number) {
    setCurrentPage(clampPage(page, totalPages));
    setSelectedManager(null);
  }

  return (
    <>
      <section
        aria-label={t.company.manager.panelAriaLabel}
        className="company-page__panel manager-view"
        id="company-directory-manager-panel"
        role="tabpanel"
      >
        <SearchFilterBar
          className="manager-view__search"
          inputAriaLabel={t.company.manager.search.ariaLabel}
          onChange={handleSearchChange}
          placeholder={t.company.manager.search.placeholder}
          showFilterButton={false}
          value={searchValue}
        />

        <div className="company-page__divider" />

        <ManagerTable
          emptyMessage={emptyMessage}
          managers={visibleManagers}
          onOpenManager={setSelectedManager}
        />

        {filteredManagers.length ? (
          <TableFooter
            className="manager-view__footer"
            currentPage={activePage}
            onPageChange={handlePageChange}
            perPage={MANAGERS_PER_PAGE}
            showPageSizeSelector={false}
            showSinglePage
            totalItems={filteredManagers.length}
            totalPages={totalPages}
          />
        ) : null}
      </section>

      {selectedManager ? (
        <ManagerDetailsModal
          manager={selectedManager}
          onClose={() => setSelectedManager(null)}
        />
      ) : null}
    </>
  );
}
