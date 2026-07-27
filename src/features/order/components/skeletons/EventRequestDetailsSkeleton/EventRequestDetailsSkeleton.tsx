import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./EventRequestDetailsSkeleton.scss";

const DETAIL_CARDS = [
  { rows: 3, titleWidth: 132 },
  { rows: 2, titleWidth: 96 },
  { rows: 3, titleWidth: 118 },
  { rows: 3, titleWidth: 104 },
] as const;

export function EventRequestDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.order.eventRequests.details.loading}
      </span>
      <div aria-hidden="true" className="event-request-details-skeleton">
        <div className="event-request-details-modal__logo-showcase">
          <Skeleton height={56} variant="rect" width={214} />
        </div>
        <div className="event-request-details-modal__content-grid">
          {[0, 1].map((columnIndex) => (
            <div className="event-request-details-modal__column" key={columnIndex}>
              {DETAIL_CARDS.slice(columnIndex * 2, columnIndex * 2 + 2).map(
                (card) => (
                  <Card
                    bodyClassName="event-request-details-modal__card-body"
                    className="event-request-details-modal__card"
                    icon={<Skeleton height={34} variant="rect" width={34} />}
                    iconClassName="event-request-details-modal__card-icon"
                    key={card.titleWidth}
                    title={<Skeleton height={18} width={card.titleWidth} />}
                    titleClassName="event-request-details-modal__card-title"
                  >
                    <div className="event-request-details-skeleton__facts">
                      {Array.from({ length: card.rows }, (_, rowIndex) => (
                        <span key={rowIndex}>
                          <Skeleton height={11} width={58 + rowIndex * 8} />
                          <Skeleton height={14} width={`${72 - rowIndex * 8}%`} />
                        </span>
                      ))}
                    </div>
                  </Card>
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
