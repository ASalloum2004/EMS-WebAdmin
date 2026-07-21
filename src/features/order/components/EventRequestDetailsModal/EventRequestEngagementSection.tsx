import { TotalRequestsIcon } from "../../../../assets/icons/orderIcons";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type { EventRequestEngagementSectionProps } from "./EventRequestDetailsModal.types";
import { formatNumber } from "./EventRequestDetailsModal.utils";

export function EventRequestEngagementSection({
  averageRating,
  language,
  qrScansCount,
  savedCount,
  t,
}: EventRequestEngagementSectionProps) {
  const labels = t.order.eventRequests.details;

  return (
    <EventRequestDetailsCard
      icon={
        <TotalRequestsIcon aria-hidden="true" size={19} strokeWidth={1.8} />
      }
      title={labels.engagement}
    >
      <dl className="event-request-details-modal__engagement">
        <div>
          <dt>{labels.averageRating}</dt>
          <dd>
            {averageRating === null
              ? labels.notRatedYet
              : formatNumber(
                  averageRating,
                  language,
                  labels.notRatedYet,
                  1,
                )}
          </dd>
        </div>
        <div>
          <dt>{labels.qrScans}</dt>
          <dd>
            {formatNumber(qrScansCount, language, labels.notAvailable)}
          </dd>
        </div>
        <div>
          <dt>{labels.savedCount}</dt>
          <dd>{formatNumber(savedCount, language, labels.notAvailable)}</dd>
        </div>
      </dl>
    </EventRequestDetailsCard>
  );
}
