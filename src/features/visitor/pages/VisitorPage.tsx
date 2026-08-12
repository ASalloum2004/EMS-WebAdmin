import { useMemo, type ReactNode } from "react";
import { Mars, Users, Venus } from "lucide-react";
import {
  Card,
  DataTable,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import {
  VisitorFiltersPanel,
  VisitorStatsSkeleton,
  VisitorTableSkeleton,
  getVisitorColumns,
} from "../components";
import { useVisitors, useVisitorStatistics } from "../hooks";
import type { VisitorStatisticsData } from "../types";
import "./VisitorPage.scss";

type SummaryCardKey = keyof VisitorStatisticsData;

export function VisitorPage() {
  const { language, t } = useI18n();
  const visitorsState = useVisitors(t.visitor.table.loadError);
  const visitorStatistics = useVisitorStatistics(
    t.visitor.summary.loadError,
  );
  const columns = useMemo(() => getVisitorColumns(t), [t]);
  const formatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
  const summaryCards: Array<{
    icon: ReactNode;
    key: SummaryCardKey;
    label: string;
  }> = [
    {
      icon: <Users aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "total_visitors",
      label: t.visitor.summary.totalVisitors,
    },
    {
      icon: <Venus aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "female_visitors",
      label: t.visitor.summary.womenVisitors,
    },
    {
      icon: <Mars aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "male_visitors",
      label: t.visitor.summary.menVisitors,
    },
  ];
  const emptyMessage = visitorsState.hasActiveCriteria
    ? t.visitor.table.noResults
    : t.visitor.table.empty;
  const isVisitorListLoading =
    visitorsState.isLoading || visitorsState.isRefreshing;

  return (
    <ManagementLayout>
      <div className="visitor-page">
        <header className="visitor-page__header">
          <h1>{t.visitor.title}</h1>
          <p>{t.visitor.description}</p>
        </header>

        {visitorStatistics.isLoading ? (
          <VisitorStatsSkeleton />
        ) : (
        <div
          aria-busy={visitorStatistics.isRefreshing}
          className="visitor-page__summary"
        >
          {summaryCards.map((summaryCard) => {
            const value =
              visitorStatistics.statistics?.[summaryCard.key] ?? null;

            return (
              <Card
                className={`visitor-page__summary-card visitor-page__summary-card--${summaryCard.key}`}
                icon={summaryCard.icon}
                iconClassName="visitor-page__summary-icon"
                key={summaryCard.key}
                title={summaryCard.label}
                titleClassName="visitor-page__summary-label"
              >
                <strong
                  aria-label={
                    value === null
                      ? t.visitor.summary.unavailable
                      : undefined
                  }
                  aria-live="polite"
                  className="visitor-page__summary-value"
                >
                  {value === null ? "—" : formatter.format(value)}
                </strong>
              </Card>
            );
          })}
        </div>
        )}

        {visitorStatistics.error ? (
          <div className="visitor-page__state" role="alert">
            <p>
              {visitorStatistics.error || t.visitor.summary.loadError}
            </p>
            <button
              onClick={() => void visitorStatistics.refetch()}
              type="button"
            >
              {t.common.tryAgain}
            </button>
          </div>
        ) : null}

        <Card
          aria-busy={isVisitorListLoading}
          aria-label={t.visitor.panelAriaLabel}
          bodyClassName="visitor-page__panel-body"
          className="visitor-page__panel"
        >
          <SearchFilterBar
            className="visitor-page__search"
            filterAriaLabel={t.visitor.filters.filterAriaLabel}
            filterLabel={t.common.filter}
            inputAriaLabel={t.visitor.search.ariaLabel}
            onChange={visitorsState.setSearchValue}
            onFilterClick={visitorsState.filters.toggleFilterPanel}
            placeholder={t.visitor.search.placeholder}
            showFilterButton
            value={visitorsState.searchValue}
          />

          {visitorsState.filters.isFilterPanelOpen ? (
            <VisitorFiltersPanel
              filters={visitorsState.filters.draftFilters}
              onApply={visitorsState.filters.applyFilters}
              onChange={visitorsState.filters.setDraftFilters}
              onClear={visitorsState.filters.clearFilters}
            />
          ) : null}

          {isVisitorListLoading ? <VisitorTableSkeleton /> : null}

          {!isVisitorListLoading && visitorsState.error ? (
            <div className="visitor-page__state" role="alert">
              <p>{visitorsState.error || t.visitor.table.loadError}</p>
              <button
                onClick={() => void visitorsState.refetch()}
                type="button"
              >
                {t.common.tryAgain}
              </button>
            </div>
          ) : null}

          {!isVisitorListLoading && !visitorsState.error ? (
            <DataTable
              ariaLabel={t.visitor.table.ariaLabel}
              className="visitor-page__table"
              columns={columns}
              emptyMessage={emptyMessage}
              getItemKey={(visitor) => visitor.id}
              items={visitorsState.visitors}
            />
          ) : null}

          {!isVisitorListLoading &&
          !visitorsState.error &&
          visitorsState.visitors.length ? (
            <TableFooter
              className="visitor-page__footer"
              currentPage={visitorsState.currentPage}
              onPageChange={visitorsState.setCurrentPage}
              perPage={visitorsState.perPage}
              showSinglePage
              totalItems={visitorsState.totalItems}
              totalPages={visitorsState.totalPages}
            />
          ) : null}
        </Card>
      </div>
    </ManagementLayout>
  );
}
