import { useMemo, useState, type ReactNode } from "react";
import { Mars, Users, Venus } from "lucide-react";
import {
  Card,
  DataTable,
  filterBySearchQuery,
  SearchFilterBar,
  TableFooter,
} from "../../../components";
import { useI18n, type I18nDictionary } from "../../../i18n";
import { ManagementLayout } from "../../../layouts";
import { VisitorFiltersPanel, getVisitorColumns } from "../components";
import { mockVisitorsResponse } from "../data";
import type {
  VisitorApiData,
  VisitorDateFilter,
  VisitorStatistics,
} from "../types";
import "./VisitorPage.scss";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type SummaryCardKey = keyof VisitorStatistics;

function getDateFilterLabel(
  t: I18nDictionary,
  dateFilter: VisitorDateFilter,
) {
  const labels: Record<VisitorDateFilter, string> = {
    any: t.visitor.filters.anyTime,
    today: t.visitor.filters.today,
    last7Days: t.visitor.filters.last7Days,
    last30Days: t.visitor.filters.last30Days,
  };

  return labels[dateFilter];
}

function getMockDateAnchor(visitors: VisitorApiData[]) {
  return visitors.reduce((latestTimestamp, visitor) => {
    const timestamp = Date.parse(visitor.created_at);
    return Number.isNaN(timestamp)
      ? latestTimestamp
      : Math.max(latestTimestamp, timestamp);
  }, 0);
}

function matchesDateFilter(
  visitor: VisitorApiData,
  dateFilter: VisitorDateFilter,
  anchorTimestamp: number,
) {
  if (dateFilter === "any") {
    return true;
  }

  const createdTimestamp = Date.parse(visitor.created_at);

  if (Number.isNaN(createdTimestamp) || anchorTimestamp === 0) {
    return false;
  }

  const elapsedDays =
    (anchorTimestamp - createdTimestamp) / DAY_IN_MILLISECONDS;

  if (dateFilter === "today") {
    const createdDate = new Date(createdTimestamp);
    const anchorDate = new Date(anchorTimestamp);

    return (
      createdDate.getUTCFullYear() === anchorDate.getUTCFullYear() &&
      createdDate.getUTCMonth() === anchorDate.getUTCMonth() &&
      createdDate.getUTCDate() === anchorDate.getUTCDate()
    );
  }

  if (dateFilter === "last7Days") {
    return elapsedDays <= 7;
  }

  return elapsedDays <= 30;
}

export function VisitorPage() {
  const { language, t } = useI18n();
  const visitorResponse = mockVisitorsResponse;
  const allVisitors = visitorResponse.data.data;
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(
    visitorResponse.data.current_page,
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [dateFilter, setDateFilter] =
    useState<VisitorDateFilter>("any");
  const [draftDateFilter, setDraftDateFilter] =
    useState<VisitorDateFilter>("any");
  const columns = useMemo(() => getVisitorColumns(t), [t]);
  const dateAnchor = useMemo(
    () => getMockDateAnchor(allVisitors),
    [allVisitors],
  );
  const filteredVisitors = useMemo(() => {
    const searchResults = filterBySearchQuery(
      allVisitors,
      searchValue,
      (visitor) => [
        visitor.first_name,
        visitor.last_name,
        `${visitor.first_name} ${visitor.last_name}`,
        visitor.email,
        visitor.phone,
        visitor.job,
        visitor.location,
      ],
    );

    return searchResults.filter((visitor) =>
      matchesDateFilter(visitor, dateFilter, dateAnchor),
    );
  }, [allVisitors, dateAnchor, dateFilter, searchValue]);
  const perPage = visitorResponse.data.per_page;
  const hasSearchOrFilter = Boolean(searchValue.trim()) || dateFilter !== "any";
  const totalItems = hasSearchOrFilter
    ? filteredVisitors.length
    : visitorResponse.data.total;
  const totalPages = hasSearchOrFilter
    ? Math.max(1, Math.ceil(totalItems / perPage))
    : visitorResponse.data.last_page;
  const activePage = Math.min(currentPage, totalPages);
  const pageStartIndex = (activePage - 1) * perPage;
  const visibleVisitors = filteredVisitors.slice(
    pageStartIndex,
    pageStartIndex + perPage,
  );
  const hasVisitors = allVisitors.length > 0;
  const emptyMessage = !hasVisitors
    ? t.visitor.table.empty
    : hasSearchOrFilter
      ? t.visitor.table.noResults
      : t.visitor.table.empty;
  const formatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
  const visitorStatistics = useMemo<VisitorStatistics>(() => {
    const genderCounts = allVisitors.reduce(
      (counts, visitor) => {
        const normalizedGender = visitor.gender?.trim().toLowerCase();

        if (normalizedGender === "female") {
          counts.women += 1;
        } else if (normalizedGender === "male") {
          counts.men += 1;
        }

        return counts;
      },
      { men: 0, women: 0 },
    );

    return {
      total_visitors: visitorResponse.data.total,
      women_visitors: genderCounts.women,
      men_visitors: genderCounts.men,
    };
  }, [allVisitors, visitorResponse.data.total]);
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
      key: "women_visitors",
      label: t.visitor.summary.womenVisitors,
    },
    {
      icon: <Mars aria-hidden="true" size={22} strokeWidth={1.8} />,
      key: "men_visitors",
      label: t.visitor.summary.menVisitors,
    },
  ];
  const filterValueLabel = getDateFilterLabel(t, dateFilter);
  const filterButtonLabel = t.visitor.filters.dateFilterLabel.replace(
    "{{value}}",
    filterValueLabel,
  );

  function handleSearchChange(value: string) {
    setSearchValue(value);
    setCurrentPage(1);
  }

  function applyDateFilter() {
    setDateFilter(draftDateFilter);
    setCurrentPage(1);
    setIsFilterPanelOpen(false);
  }

  function clearDateFilter() {
    setDraftDateFilter("any");
    setDateFilter("any");
    setCurrentPage(1);
  }

  return (
    <ManagementLayout>
      <div className="visitor-page">
        <header className="visitor-page__header">
          <h1>{t.visitor.title}</h1>
          <p>{t.visitor.description}</p>
        </header>

        <div className="visitor-page__summary">
          {summaryCards.map((summaryCard) => (
            <Card
              className={`visitor-page__summary-card visitor-page__summary-card--${summaryCard.key}`}
              icon={summaryCard.icon}
              iconClassName="visitor-page__summary-icon"
              key={summaryCard.key}
              title={summaryCard.label}
              titleClassName="visitor-page__summary-label"
            >
              <strong className="visitor-page__summary-value">
                {formatter.format(visitorStatistics[summaryCard.key])}
              </strong>
            </Card>
          ))}
        </div>

        <Card
          aria-label={t.visitor.panelAriaLabel}
          bodyClassName="visitor-page__panel-body"
          className="visitor-page__panel"
        >
          <SearchFilterBar
            className="visitor-page__search"
            filterAriaLabel={t.visitor.filters.filterAriaLabel}
            filterLabel={filterButtonLabel}
            inputAriaLabel={t.visitor.search.ariaLabel}
            onChange={handleSearchChange}
            onFilterClick={() =>
              setIsFilterPanelOpen((isOpen) => !isOpen)
            }
            placeholder={t.visitor.search.placeholder}
            showFilterButton
            value={searchValue}
          />

          {isFilterPanelOpen ? (
            <VisitorFiltersPanel
              dateFilter={draftDateFilter}
              onApply={applyDateFilter}
              onChange={setDraftDateFilter}
              onClear={clearDateFilter}
            />
          ) : null}

          <DataTable
            ariaLabel={t.visitor.table.ariaLabel}
            className="visitor-page__table"
            columns={columns}
            emptyMessage={emptyMessage}
            getItemKey={(visitor) => visitor.id}
            items={visibleVisitors}
          />

          {totalItems > 0 ? (
            <TableFooter
              className="visitor-page__footer"
              currentPage={activePage}
              onPageChange={setCurrentPage}
              perPage={perPage}
              showSinglePage
              totalItems={totalItems}
              totalPages={totalPages}
            />
          ) : null}
        </Card>
      </div>
    </ManagementLayout>
  );
}
