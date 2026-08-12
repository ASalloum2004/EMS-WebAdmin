import { useCallback, useMemo, useState, type ReactNode } from "react";
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
  ReportDetailsModal,
  ReportListSkeleton,
  ReportStatsSkeleton,
  ReportTable,
} from "../components";
import {
  useReportActions,
  useReportDetails,
  useReports,
  useReportStatistics,
} from "../hooks";
import type { ReportItem, ReportStatisticsData } from "../types";
import "./ReportsPage.scss";

type ReportSummaryKey = keyof ReportStatisticsData;

type ReportSummaryCard = {
  icon: ReactNode;
  key: ReportSummaryKey;
  label: string;
};

export function ReportsPage() {
  const { language, t } = useI18n();
  const [selectedReportId, setSelectedReportId] = useState<number | null>(
    null,
  );
  const reportStatistics = useReportStatistics(
    t.reports.summary.loadError,
  );
  const reports = useReports(t.reports.table.loadError);
  const reportDetails = useReportDetails(
    selectedReportId,
    t.reports.details.loadError,
  );
  const refreshAfterReportAction = useCallback(async () => {
    await Promise.all([
      reportDetails.refetch(),
      reports.refetch(),
      reportStatistics.refetch(),
    ]);
  }, [
    reportDetails.refetch,
    reports.refetch,
    reportStatistics.refetch,
  ]);
  const reportActions = useReportActions({
    onActionSuccess: refreshAfterReportAction,
    rejectFallbackMessage:
      t.reports.details.actionConfirmation.reject.error,
    resolveFallbackMessage:
      t.reports.details.actionConfirmation.resolve.error,
  });
  const openReportDetails = useCallback((report: ReportItem) => {
    setSelectedReportId(report.id);
  }, []);
  const closeReportDetails = useCallback(() => {
    reportActions.clearRejectError();
    reportActions.clearResolveError();
    setSelectedReportId(null);
  }, [
    reportActions.clearRejectError,
    reportActions.clearResolveError,
  ]);
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US"),
    [language],
  );
  const hasActiveFilters = Boolean(
    reports.filters.appliedFilters.createdDate.trim() ||
      reports.filters.appliedFilters.status,
  );
  const hasActiveCriteria =
    Boolean(reports.searchValue.trim()) || hasActiveFilters;
  const isReportListLoading = reports.isLoading || reports.isRefreshing;
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

  return (
    <ManagementLayout>
      <div className="reports-page">
        <header className="reports-page__header">
          <h1>{t.reports.title}</h1>
          <p>{t.reports.description}</p>
        </header>

        {reportStatistics.isLoading ? (
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
          <div aria-busy={isReportListLoading}>
            <SearchFilterBar
              className="reports-page__search"
              filterAriaLabel={t.reports.filters.filterAriaLabel}
              filterLabel={t.common.filter}
              inputAriaLabel={t.reports.search.ariaLabel}
              isFilterActive={hasActiveFilters}
              onChange={reports.setSearchValue}
              onFilterClick={reports.filters.toggleFilterPanel}
              placeholder={t.reports.search.placeholder}
              showFilterButton
              value={reports.searchValue}
            />

            {reports.filters.isFilterPanelOpen ? (
              <ReportFiltersPanel
                filters={reports.filters.draftFilters}
                onApply={reports.filters.applyFilters}
                onChange={reports.filters.setDraftFilters}
                onClear={reports.filters.clearFilters}
              />
            ) : null}

            <div className="reports-page__divider" />

            {isReportListLoading ? <ReportListSkeleton /> : null}

            {!isReportListLoading && reports.error ? (
              <div className="reports-page__state" role="alert">
                <p>{reports.error || t.reports.table.loadError}</p>
                <button onClick={() => void reports.refetch()} type="button">
                  {t.common.tryAgain}
                </button>
              </div>
            ) : null}

            {!isReportListLoading &&
            (!reports.error || reports.reports.length) ? (
              <ReportTable
                emptyMessage={
                  hasActiveCriteria
                    ? t.reports.table.noResults
                    : t.reports.table.empty
                }
                items={reports.reports}
                onSelectReport={openReportDetails}
              />
            ) : null}

            {!isReportListLoading && reports.reports.length ? (
              <TableFooter
                className="reports-page__footer"
                currentPage={reports.currentPage}
                onPageChange={reports.setCurrentPage}
                perPage={reports.perPage}
                showItemRange
                showPageSizeSelector={false}
                showSinglePage
                totalItems={reports.totalItems}
                totalPages={reports.totalPages}
              />
            ) : null}
          </div>
        </Card>
      </div>

      {selectedReportId !== null ? (
        <ReportDetailsModal
          details={reportDetails.details}
          error={reportDetails.error}
          isRejecting={reportActions.isRejecting}
          isResolving={reportActions.isResolving}
          isLoading={reportDetails.isLoading}
          onClearRejectError={reportActions.clearRejectError}
          onClearResolveError={reportActions.clearResolveError}
          onClose={closeReportDetails}
          onReject={reportActions.rejectReportById}
          onResolve={reportActions.resolveReportById}
          onRetry={() => void reportDetails.refetch()}
          rejectError={reportActions.rejectError}
          rejectFieldErrors={reportActions.rejectFieldErrors}
          reportId={selectedReportId}
          resolveError={reportActions.resolveError}
          resolveFieldErrors={reportActions.resolveFieldErrors}
        />
      ) : null}
    </ManagementLayout>
  );
}
