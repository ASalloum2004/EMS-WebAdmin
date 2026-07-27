import { Card, Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./BoothRequestDetailsSkeleton.scss";

const DETAIL_CARDS = [
  { factWidths: [112, 86, 104], titleWidth: 126 },
  { factWidths: [136, 98], titleWidth: 108 },
  { factWidths: [124, 112, 94], titleWidth: 118 },
  { factWidths: [142, 116], titleWidth: 96 },
] as const;

export function BoothRequestDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.order.details.loading}
      </span>
      <div aria-hidden="true" className="booth-request-details-skeleton">
        <div className="booth-request-details-modal__gallery">
          <Skeleton height={30} variant="rect" width={30} />
          <span>
            <Skeleton height={16} width={142} />
            <Skeleton height={12} width={198} />
          </span>
        </div>
        <div className="booth-request-details-modal__content-grid">
          {[0, 1].map((columnIndex) => (
            <div className="booth-request-details-modal__column" key={columnIndex}>
              {DETAIL_CARDS.slice(columnIndex * 2, columnIndex * 2 + 2).map(
                (card) => (
                  <Card
                    bodyClassName="booth-request-details-modal__card-body"
                    className="booth-request-details-modal__card"
                    icon={<Skeleton height={34} variant="rect" width={34} />}
                    iconClassName="booth-request-details-modal__card-icon"
                    key={card.titleWidth}
                    title={<Skeleton height={18} width={card.titleWidth} />}
                    titleClassName="booth-request-details-modal__card-title"
                  >
                    <div className="booth-request-details-skeleton__facts">
                      {card.factWidths.map((width) => (
                        <span key={width}>
                          <Skeleton height={11} width={64} />
                          <Skeleton height={14} width={width} />
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
