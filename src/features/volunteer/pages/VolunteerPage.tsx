import { useCallback, useMemo, useState } from "react";
import { Card, DataTable, SearchFilterBar, TableFooter } from "../../../components";
import { useI18n } from "../../../i18n";
import {
  ApprovedIcon,
  PendingRequestIcon,
  TotalRequestsIcon,
  VolunteerApplicationDetailsModal,
  VolunteerApplicationListSkeleton,
  VolunteerFiltersPanel,
  VolunteerStatsSkeleton,
  getVolunteerApplicationColumns,
} from "../components";
import { getVolunteerApplicationCv } from "../api";
import {
  useVolunteerApplicationActions,
  useVolunteerApplicationDetails,
  useVolunteerApplicationStatistics,
  useVolunteerApplications,
} from "../hooks";
import "../../order/pages/OrderPage.scss";
import "./VolunteerPageRefined.scss";

export function VolunteerPage() {
  const { t } = useI18n();
  const applications = useVolunteerApplications();
  const statistics = useVolunteerApplicationStatistics();
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const details = useVolunteerApplicationDetails(selectedApplicationId);
  const actions = useVolunteerApplicationActions();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  const columns = useMemo(() => getVolunteerApplicationColumns({
    createdAt: t.volunteers.table.createdAt,
    email: t.volunteers.table.email,
    name: t.volunteers.table.name,
    phone: t.volunteers.table.phone,
    status: t.volunteers.table.status,
    unknownStatus: t.volunteers.status.unknown,
    pending: t.volunteers.status.pending,
    approved: t.volunteers.status.approved,
    rejected: t.volunteers.status.rejected,
  }), [t]);

  const closeDetails = useCallback(() => {
    actions.clearError();
    setCvError(null);
    setSelectedApplicationId(null);
  }, [actions]);

  const completeReview = useCallback(async (decision: "approve" | "reject", reviewNote: string) => {
    if (selectedApplicationId === null) return;
    const didSucceed = await actions.review(selectedApplicationId, decision, reviewNote);
    if (!didSucceed) return;
    applications.refresh();
    statistics.refresh();
    details.refresh();
  }, [actions, applications, details, selectedApplicationId, statistics]);

  const viewCv = useCallback(async () => {
    if (selectedApplicationId === null || !details.application?.cv) return;
    setCvError(null);
    try {
      const file = await getVolunteerApplicationCv(selectedApplicationId);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = details.application.cv.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setCvError(t.volunteers.details.cvError);
    }
  }, [details.application, selectedApplicationId, t.volunteers.details.cvError]);

  const modalError = details.error
    ? t.volunteers.loadDetailsError
    : actions.error
      ? t.volunteers.details.reviewError
      : cvError;

  const summaryCards = [
    { icon: <TotalRequestsIcon />, key: "total", label: t.volunteers.summary.total, value: statistics.statistics?.total ?? null },
    { icon: <PendingRequestIcon />, key: "pending", label: t.volunteers.summary.pending, value: statistics.statistics?.pending ?? null },
    { icon: <ApprovedIcon />, key: "approved", label: t.volunteers.summary.approved, value: statistics.statistics?.approved ?? null },
  ];

  return (
    <main className="order-page volunteer-page">
      <div className="order-page__container">
        <header className="order-page__header"><h1>{t.volunteers.title}</h1><p>{t.volunteers.description}</p></header>
        {statistics.isLoading ? <VolunteerStatsSkeleton /> : <section aria-busy="false" aria-label={t.volunteers.summary.ariaLabel} className="order-page__summary">{summaryCards.map((card) => <Card className={`order-page__summary-card order-page__summary-card--${card.key}`} icon={card.icon} iconClassName={`order-page__summary-icon order-page__summary-icon--${card.key}`} key={card.key} title={card.label} titleClassName="order-page__summary-label"><strong className="order-page__summary-value">{card.value ?? t.volunteers.summary.unavailable}</strong></Card>)}</section>}
        {statistics.error ? <div className="order-page__state" role="alert"><p>{t.volunteers.summary.loadError}</p><button type="button" onClick={statistics.refresh}>{t.common.tryAgain}</button></div> : null}
        <Card aria-label={t.volunteers.table.ariaLabel} bodyClassName="order-page__panel-body" className="order-page__panel">
          <SearchFilterBar filterAriaLabel={t.volunteers.filters.filterAriaLabel} filterLabel={t.volunteers.filters.filterLabel} inputAriaLabel={t.volunteers.filters.searchAriaLabel} isFilterActive={applications.status !== "all" || applications.sort !== "-created_at"} onChange={applications.setSearch} onFilterClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)} placeholder={t.volunteers.filters.searchPlaceholder} value={applications.search} />
          {isFilterPanelOpen ? <VolunteerFiltersPanel key={`${applications.status}-${applications.sort}`} status={applications.status} sort={applications.sort} onApply={(filters) => { applications.setStatus(filters.status); applications.setSort(filters.sort); setIsFilterPanelOpen(false); }} onClear={() => { applications.setStatus("all"); applications.setSort("-created_at"); setIsFilterPanelOpen(false); }} /> : null}
          {applications.isLoading ? <VolunteerApplicationListSkeleton /> : null}
          {!applications.isLoading && applications.error ? <div className="order-page__state" role="alert"><p>{t.volunteers.table.loadError}</p><button type="button" onClick={applications.refresh}>{t.common.tryAgain}</button></div> : null}
          {!applications.isLoading && !applications.error ? <DataTable aria-busy={applications.isRefreshing} ariaLabel={t.volunteers.table.ariaLabel} className="order-page__table volunteer-table" columns={columns} emptyMessage={t.volunteers.table.empty} getItemAriaLabel={(application) => `${t.volunteers.table.openDetails}: ${application.fullName}`} getItemKey={(application) => String(application.id)} items={applications.applications} onItemClick={(application) => setSelectedApplicationId(application.id)} /> : null}
          {!applications.isLoading && !applications.error && applications.applications.length ? <TableFooter className="order-page__footer" currentPage={applications.pagination.currentPage} onPageChange={applications.setPage} perPage={applications.pagination.perPage} showSinglePage totalItems={applications.pagination.totalItems} totalPages={applications.pagination.totalPages} /> : null}
        </Card>
      </div>
      {selectedApplicationId !== null ? <VolunteerApplicationDetailsModal application={details.application} error={modalError} isLoading={details.isLoading} isSubmitting={actions.isSubmitting} onApprove={(reviewNote) => void completeReview("approve", reviewNote)} onClose={closeDetails} onReject={(reviewNote) => void completeReview("reject", reviewNote)} onViewCv={() => void viewCv()} /> : null}
    </main>
  );
}
