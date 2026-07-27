import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./VisitorStatsSkeleton.scss";

const CARD_LAYOUTS = [
  { titleWidth: 102, valueWidth: 54 },
  { titleWidth: 126, valueWidth: 48 },
  { titleWidth: 112, valueWidth: 52 },
] as const;

export function VisitorStatsSkeleton() {
  const { t } = useI18n();

  return (
    <div aria-busy="true" className="visitor-page__summary visitor-stats-skeleton">
      <span className="skeleton__loading-message" role="status">
        {t.visitor.summary.loading}
      </span>
      {CARD_LAYOUTS.map((layout) => (
        <Card
          aria-hidden="true"
          className="visitor-page__summary-card visitor-stats-skeleton__card"
          icon={<Skeleton height={42} variant="rect" width={42} />}
          iconClassName="visitor-page__summary-icon visitor-stats-skeleton__icon"
          key={layout.titleWidth}
          title={<Skeleton height={16} width={layout.titleWidth} />}
          titleClassName="visitor-page__summary-label"
        >
          <strong className="visitor-page__summary-value">
            <Skeleton height={34} width={layout.valueWidth} />
          </strong>
        </Card>
      ))}
    </div>
  );
}
