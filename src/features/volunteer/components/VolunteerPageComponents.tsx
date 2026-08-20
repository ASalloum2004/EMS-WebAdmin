import { useMemo, useState } from "react";
import { ApprovedIcon, PendingRequestIcon, TotalRequestsIcon } from "../../../assets/icons/orderIcons";
import { Card, DataTable, Skeleton, type DataTableColumn } from "../../../components";
import { useI18n } from "../../../i18n";
import type { VolunteerApplicationStatus } from "../types";
import "../../order/components/OrderFiltersPanel/OrderFiltersPanel.scss";
import "../../order/components/skeletons/EventRequestListSkeleton/EventRequestListSkeleton.scss";
import "../../order/components/skeletons/OrderStatsSkeleton/OrderStatsSkeleton.scss";

type VolunteerSkeletonRow = { id: number; nameWidth: number; phoneWidth: number; submittedWidth: number };
const SKELETON_ROWS: VolunteerSkeletonRow[] = [
  { id: 1, nameWidth: 168, phoneWidth: 118, submittedWidth: 132 },
  { id: 2, nameWidth: 196, phoneWidth: 126, submittedWidth: 148 },
  { id: 3, nameWidth: 144, phoneWidth: 114, submittedWidth: 126 },
  { id: 4, nameWidth: 176, phoneWidth: 122, submittedWidth: 142 },
];

export function VolunteerApplicationListSkeleton() {
  const { t } = useI18n();
  const columns = useMemo<Array<DataTableColumn<VolunteerSkeletonRow>>>(() => [
    { key: "name", label: t.volunteers.table.name, render: (row) => <Skeleton height={18} width={row.nameWidth} />, supportingText: () => <Skeleton height={14} width={144} />, variant: "primary" },
    { key: "phone", label: t.volunteers.table.phone, render: (row) => <Skeleton height={14} width={row.phoneWidth} /> },
    { className: "order-table__cell--status", key: "status", label: t.volunteers.table.status, render: () => <Skeleton height={28} variant="pill" width={86} />, variant: "badge" },
    { className: "order-table__cell--created", key: "created", label: t.volunteers.table.createdAt, render: (row) => <Skeleton height={14} width={row.submittedWidth} /> },
  ], [t]);
  return <><span className="skeleton__loading-message" role="status">{t.volunteers.table.loading}</span><div aria-hidden="true" className="event-request-list-skeleton"><DataTable ariaLabel={t.volunteers.table.ariaLabel} className="order-page__table volunteer-table" columns={columns} getItemKey={(row) => row.id} items={SKELETON_ROWS} /></div></>;
}

const CARD_LAYOUTS = [
  { icon: <TotalRequestsIcon />, key: "total", titleWidth: 112, valueWidth: 54 },
  { icon: <PendingRequestIcon />, key: "pending", titleWidth: 126, valueWidth: 48 },
  { icon: <ApprovedIcon />, key: "approved", titleWidth: 96, valueWidth: 52 },
] as const;

export function VolunteerStatsSkeleton() {
  const { t } = useI18n();
  return <div aria-busy="true" className="order-page__summary order-stats-skeleton"><span className="skeleton__loading-message" role="status">{t.volunteers.summary.loading}</span>{CARD_LAYOUTS.map((layout) => <Card aria-hidden="true" className="order-page__summary-card order-stats-skeleton__card" icon={<Skeleton height={42} variant="rect" width={42} />} iconClassName={`order-page__summary-icon order-stats-skeleton__icon order-page__summary-icon--${layout.key}`} key={layout.key} title={<Skeleton height={16} width={layout.titleWidth} />} titleClassName="order-page__summary-label"><strong className="order-page__summary-value"><Skeleton height={34} width={layout.valueWidth} /></strong></Card>)}</div>;
}

type VolunteerSort = "created_at" | "-created_at" | "full_name" | "-full_name" | "status" | "-status";
type VolunteerFiltersPanelProps = {
  status: VolunteerApplicationStatus | "all";
  sort: VolunteerSort;
  onApply: (filters: { status: VolunteerApplicationStatus | "all"; sort: VolunteerSort }) => void;
  onClear: () => void;
};

export function VolunteerFiltersPanel({ status, sort, onApply, onClear }: VolunteerFiltersPanelProps) {
  const { t } = useI18n();
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftSort, setDraftSort] = useState(sort);
  return <div aria-label={t.volunteers.filters.panelAriaLabel} className="order-filters-panel volunteer-filters-panel"><div className="order-filters-panel__grid volunteer-filters-panel__grid"><label className="order-filters-panel__field"><span>{t.volunteers.filters.status}</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as VolunteerApplicationStatus | "all")}><option value="all">{t.volunteers.filters.allStatuses}</option><option value="pending">{t.volunteers.status.pending}</option><option value="approved">{t.volunteers.status.approved}</option><option value="rejected">{t.volunteers.status.rejected}</option></select></label><label className="order-filters-panel__field"><span>{t.volunteers.filters.sort}</span><select value={draftSort} onChange={(event) => setDraftSort(event.target.value as VolunteerSort)}><option value="-created_at">{t.volunteers.filters.newestFirst}</option><option value="created_at">{t.volunteers.filters.oldestFirst}</option><option value="full_name">{t.volunteers.filters.nameAscending}</option><option value="-full_name">{t.volunteers.filters.nameDescending}</option><option value="status">{t.volunteers.filters.statusAscending}</option><option value="-status">{t.volunteers.filters.statusDescending}</option></select></label></div><div className="order-filters-panel__actions"><button className="order-filters-panel__button order-filters-panel__button--secondary" type="button" onClick={onClear}>{t.common.clear}</button><button className="order-filters-panel__button order-filters-panel__button--primary" type="button" onClick={() => onApply({ status: draftStatus, sort: draftSort })}>{t.common.apply}</button></div></div>;
}

export { ApprovedIcon, PendingRequestIcon, TotalRequestsIcon };
