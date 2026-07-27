import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./OrderStatsSkeleton.scss";

const CARD_LAYOUTS = [
  { titleWidth: 112, valueWidth: 54 },
  { titleWidth: 126, valueWidth: 48 },
  { titleWidth: 96, valueWidth: 52 },
] as const;

export function OrderStatsSkeleton() {
  const { t } = useI18n();

  return (
    <div aria-busy="true" className="order-page__summary order-stats-skeleton">
      <span className="skeleton__loading-message" role="status">
        {t.order.summary.loading}
      </span>
      {CARD_LAYOUTS.map((layout) => (
        <Card
          aria-hidden="true"
          className="order-page__summary-card order-stats-skeleton__card"
          icon={<Skeleton height={42} variant="rect" width={42} />}
          iconClassName="order-page__summary-icon order-stats-skeleton__icon"
          key={layout.titleWidth}
          title={<Skeleton height={16} width={layout.titleWidth} />}
          titleClassName="order-page__summary-label"
        >
          <strong className="order-page__summary-value">
            <Skeleton height={34} width={layout.valueWidth} />
          </strong>
        </Card>
      ))}
    </div>
  );
}
