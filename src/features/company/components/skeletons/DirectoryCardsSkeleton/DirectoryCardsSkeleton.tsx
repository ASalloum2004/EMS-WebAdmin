import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./DirectoryCardsSkeleton.scss";

const CARD_TITLE_WIDTHS = [112, 138, 116] as const;

export function DirectoryCardsSkeleton() {
  const { t } = useI18n();

  return (
    <div aria-busy="true" className="manager-summary">
      <span className="skeleton__loading-message" role="status">
        {t.company.manager.summary.loading}
      </span>
      {CARD_TITLE_WIDTHS.map((titleWidth, index) => (
        <Card
          aria-hidden="true"
          className="manager-summary__card directory-cards-skeleton__card"
          icon={<Skeleton height={42} variant="rect" width={42} />}
          iconClassName="manager-summary__icon directory-cards-skeleton__icon"
          key={titleWidth}
          title={<Skeleton height={16} width={titleWidth} />}
          titleClassName="manager-summary__label directory-cards-skeleton__label"
        >
          <strong className="manager-summary__value directory-cards-skeleton__value">
            <Skeleton height={34} width={index === 2 ? 72 : 54} />
          </strong>
        </Card>
      ))}
    </div>
  );
}
