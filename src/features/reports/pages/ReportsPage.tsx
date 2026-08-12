import { useMemo, useState, type ReactNode } from "react";
import { CircleCheck, CircleX, Clock3, Flag } from "lucide-react";
import {
  Card,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  ReportFiltersPanel,
  ReportStatsSkeleton,
  ReportTable,
} from "../components";
import {
  emptyReportFilters,
  filterReports,
  reportMockData,
} from "../data";
import { useReportStatistics } from "../hooks";
import type { ReportStatisticsData } from "../types";
import "./ReportsPage.scss";

const PAGE_SIZE = 4;

type ReportSummaryKey = keyof ReportStatisticsData;

type ReportSummaryCard = {
  icon: ReactNode;
  key: ReportSummaryKey;
  label: string;
};

const initialUiState = {
  appliedFilters: emptyReportFilters,
  currentPage: 1,
  draftFilters: emptyReportFilters,
  isFilterPanelOpen: false,
  searchQuery: "",
};

export function ReportsPage() {
  const { language, t } = useI18n();
  const [ui, setUi] = useState(initialUiState);
  const reportStatistics = useReportStatistics(
    t.reports.summary.loadError,
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
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
  const summaryCards: ReportSummaryCard[] = [
    {
      icon: <Flag aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "total_requests",
      label: t.reports.summary.totalReports,
    },
    {
      icon: <Clock3 aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "pending_requests",
      label: t.reports.summary.pendingReports,
    },
    {
      icon: <CircleCheck aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "resolved_requests",
      label: t.reports.summary.resolvedReports,
    },
    {
      icon: <CircleX aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "rejected_requests",
      label: t.reports.summary.rejectedReports,
    },
  ];

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

        {reportStatistics.isInitialLoading ? (
          <ReportStatsSkeleton />
        ) : (
          <div
            aria-busy={reportStatistics.isRefreshing}
            className="reports-page__summary"
          >
            {summaryCards.map((summaryCard) => {
              const value =
                reportStatistics.statistics?.[summaryCard.key] ?? null;

              return (
                <Card
                  className={`reports-page__summary-card reports-page__summary-card--${summaryCard.key}`}
                  icon={summaryCard.icon}
                  iconClassName="reports-page__summary-icon"
                  key={summaryCard.key}
                  title={summaryCard.label}
                  titleClassName="reports-page__summary-label"
                >
                  <strong
                    aria-label={
                      value === null
                        ? t.reports.summary.unavailable
                        : undefined
                    }
                    aria-live="polite"
                    className="reports-page__summary-value"
                  >
                    {value === null ? "—" : numberFormatter.format(value)}
                  </strong>
                </Card>
              );
            })}
          </div>
        )}

        {reportStatistics.error ? (
          <div className="reports-page__state" role="alert">
            <p>
              {reportStatistics.error || t.reports.summary.loadError}
            </p>
            <button
              onClick={() => void reportStatistics.refetch()}
              type="button"
            >
              {t.common.tryAgain}
            </button>
          </div>
        ) : null}

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
