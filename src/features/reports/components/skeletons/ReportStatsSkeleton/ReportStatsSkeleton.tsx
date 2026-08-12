import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./ReportStatsSkeleton.scss";

const CARD_LAYOUTS = [
  { titleWidth: 102, valueWidth: 54 },
  { titleWidth: 126, valueWidth: 48 },
  { titleWidth: 112, valueWidth: 52 },
  { titleWidth: 118, valueWidth: 50 },
] as const;

export function ReportStatsSkeleton() {
  const { t } = useI18n();

  return (
    <div aria-busy="true" className="reports-page__summary report-stats-skeleton">
      <span className="skeleton__loading-message" role="status">
        {t.reports.summary.loading}
      </span>
      {CARD_LAYOUTS.map((layout) => (
        <Card
          aria-hidden="true"
          className="reports-page__summary-card report-stats-skeleton__card"
          icon={<Skeleton height={42} variant="rect" width={42} />}
          iconClassName="reports-page__summary-icon report-stats-skeleton__icon"
          key={layout.titleWidth}
          title={<Skeleton height={16} width={layout.titleWidth} />}
          titleClassName="reports-page__summary-label"
        >
          <strong className="reports-page__summary-value">
            <Skeleton height={34} width={layout.valueWidth} />
          </strong>
        </Card>
      ))}
    </div>
  );
}
