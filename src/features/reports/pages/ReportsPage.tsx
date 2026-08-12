import { useMemo, useState } from "react";
import {
  Card,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import { ReportFiltersPanel, ReportTable } from "../components";
import {
  emptyReportFilters,
  filterReports,
  reportMockData,
} from "../data";
import "./ReportsPage.scss";

const PAGE_SIZE = 4;

const initialUiState = {
  appliedFilters: emptyReportFilters,
  currentPage: 1,
  draftFilters: emptyReportFilters,
  isFilterPanelOpen: false,
  searchQuery: "",
};

export function ReportsPage() {
  const { t } = useI18n();
  const [ui, setUi] = useState(initialUiState);
  const filteredReports = useMemo(
    () =>
      filterReports(reportMockData, ui.searchQuery, ui.appliedFilters),
    [ui.appliedFilters, ui.searchQuery],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredReports.length / PAGE_SIZE),
  );
  const currentPage = Math.min(ui.currentPage, totalPages);
  const visibleReports = filteredReports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const hasActiveFilters = Boolean(
    ui.appliedFilters.status || ui.appliedFilters.type,
  );
  const hasActiveCriteria =
    Boolean(ui.searchQuery.trim()) || hasActiveFilters;

  function handleSearchChange(value: string) {
    setUi((state) => ({
      ...state,
      currentPage: 1,
      searchQuery: value,
    }));
  }

  function handleToggleFilters() {
    setUi((state) => ({
      ...state,
      draftFilters: state.isFilterPanelOpen
        ? state.draftFilters
        : { ...state.appliedFilters },
      isFilterPanelOpen: !state.isFilterPanelOpen,
    }));
  }

  function handleApplyFilters() {
    setUi((state) => ({
      ...state,
      appliedFilters: { ...state.draftFilters },
      currentPage: 1,
      isFilterPanelOpen: false,
    }));
  }

  function handleClearFilters() {
    setUi((state) => ({
      ...state,
      appliedFilters: emptyReportFilters,
      currentPage: 1,
      draftFilters: emptyReportFilters,
    }));
  }

  return (
    <ManagementLayout>
      <div className="reports-page">
        <header className="reports-page__header">
          <h1>{t.reports.title}</h1>
          <p>{t.reports.description}</p>
        </header>

        <Card
          aria-label={t.reports.panelAriaLabel}
          bodyClassName="reports-page__panel-body"
          className="reports-page__panel"
        >
          <SearchFilterBar
            className="reports-page__search"
            filterAriaLabel={t.reports.filters.filterAriaLabel}
            filterLabel={t.common.filter}
            inputAriaLabel={t.reports.search.ariaLabel}
            isFilterActive={hasActiveFilters}
            onChange={handleSearchChange}
            onFilterClick={handleToggleFilters}
            placeholder={t.reports.search.placeholder}
            showFilterButton
            value={ui.searchQuery}
          />

          {ui.isFilterPanelOpen ? (
            <ReportFiltersPanel
              filters={ui.draftFilters}
              onApply={handleApplyFilters}
              onChange={(draftFilters) =>
                setUi((state) => ({ ...state, draftFilters }))
              }
              onClear={handleClearFilters}
            />
          ) : null}

          <div className="reports-page__divider" />

          <ReportTable
            emptyMessage={
              hasActiveCriteria
                ? t.reports.table.noResults
                : t.reports.table.empty
            }
            items={visibleReports}
          />

          {filteredReports.length ? (
            <TableFooter
              className="reports-page__footer"
              currentPage={currentPage}
              onPageChange={(page) =>
                setUi((state) => ({ ...state, currentPage: page }))
              }
              perPage={PAGE_SIZE}
              showItemRange
              showPageSizeSelector={false}
              showSinglePage
              totalItems={filteredReports.length}
              totalPages={totalPages}
            />
          ) : null}
        </Card>
      </div>
    </ManagementLayout>
  );
}
