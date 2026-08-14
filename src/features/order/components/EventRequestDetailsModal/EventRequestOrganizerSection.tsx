import { CompanyIcon } from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type {
  EventRequestOrganizerSectionProps,
} from "./EventRequestDetailsModal.types";

export function EventRequestOrganizerSection({
  organizer,
  t,
}: EventRequestOrganizerSectionProps) {
  const labels = t.order.eventRequests.details;
  const cardIcon = (
    <CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />
  );

  if (!organizer) {
    return (
      <EventRequestDetailsCard
        icon={cardIcon}
        title={labels.organizerInformation}
      >
        <p className="event-request-details-modal__empty">
          {labels.noOrganizer}
        </p>
      </EventRequestDetailsCard>
    );
  }

  return (
    <EventRequestDetailsCard
      icon={cardIcon}
      title={labels.organizerInformation}
    >
      <dl className="event-request-details-modal__organizer-facts">
        <div>
          <dt>{labels.organizerName}</dt>
          <dd>{getTrimmedString(organizer.name) || labels.notAvailable}</dd>
        </div>
        <div>
          <dt>{labels.organizerEmail}</dt>
          <dd>{getTrimmedString(organizer.email) || labels.notAvailable}</dd>
        </div>
      </dl>
    </EventRequestDetailsCard>
  );
}
