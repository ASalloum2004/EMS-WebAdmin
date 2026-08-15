import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./NotificationStatsSkeleton.scss";

const CARD_LAYOUTS = [
  { titleWidth: 136, valueWidth: 54 },
  { titleWidth: 146, valueWidth: 48 },
  { titleWidth: 126, valueWidth: 52 },
] as const;

export function NotificationStatsSkeleton() {
  const { t } = useI18n();

  return (
    <div
      aria-busy="true"
      className="notifications-page__summary notification-stats-skeleton"
    >
      <span className="skeleton__loading-message" role="status">
        {t.notifications.summary.loading}
      </span>
      {CARD_LAYOUTS.map((layout) => (
        <Card
          aria-hidden="true"
          className="notifications-page__summary-card notification-stats-skeleton__card"
          icon={<Skeleton height={42} variant="rect" width={42} />}
          iconClassName="notifications-page__summary-icon notification-stats-skeleton__icon"
          key={layout.titleWidth}
          title={<Skeleton height={16} width={layout.titleWidth} />}
          titleClassName="notifications-page__summary-label"
        >
          <strong className="notifications-page__summary-value">
            <Skeleton height={34} width={layout.valueWidth} />
          </strong>
        </Card>
      ))}
    </div>
  );
}
