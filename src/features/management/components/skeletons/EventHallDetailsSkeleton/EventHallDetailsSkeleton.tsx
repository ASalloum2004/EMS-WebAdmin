import { Skeleton } from "../../../../../components";
import { useI18n } from "../../../../../i18n";
import "./EventHallDetailsSkeleton.scss";

export function EventHallDetailsSkeleton() {
  const { t } = useI18n();

  return (
    <>
      <span className="skeleton__loading-message" role="status">
        {t.management.eventHalls.details.loading}
      </span>
      <div aria-hidden="true" className="event-hall-details-skeleton">
        <section className="management-event-hall-details__section">
          <Skeleton height={20} width={142} />
          <div className="management-event-hall-details__summary-grid">
            {[78, 96, 84, 112].map((width) => (
              <div key={width}>
                <Skeleton height={11} width={58} />
                <Skeleton height={15} width={width} />
              </div>
            ))}
          </div>
        </section>
        <section className="management-event-hall-details__section">
          <div className="management-event-hall-details__section-heading">
            <Skeleton height={20} width={178} />
            <Skeleton height={24} variant="pill" width={74} />
          </div>
          <div className="management-event-hall-details__events">
            {[0, 1].map((rowIndex) => (
              <article className="management-event-hall-details__event-card" key={rowIndex}>
                <div className="management-event-hall-details__event-heading">
                  <Skeleton height={18} width={rowIndex ? 164 : 198} />
                  <div className="management-event-hall-details__badges">
                    <Skeleton height={26} variant="pill" width={76} />
                    <Skeleton height={26} variant="pill" width={84} />
                  </div>
                </div>
                <Skeleton height={14} width="92%" />
                <Skeleton height={14} width="68%" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
