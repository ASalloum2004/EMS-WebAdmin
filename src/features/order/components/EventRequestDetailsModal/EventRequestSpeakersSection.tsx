import { ContactIcon } from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type { EventRequestSpeakersSectionProps } from "./EventRequestDetailsModal.types";
import { getInitials } from "./EventRequestDetailsModal.utils";

export function EventRequestSpeakersSection({
  speakers,
  t,
}: EventRequestSpeakersSectionProps) {
  const labels = t.order.eventRequests.details;

  return (
    <EventRequestDetailsCard
      icon={<ContactIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.speakers}
    >
      {speakers.length ? (
        <ul className="event-request-details-modal__speakers">
          {speakers.map((speaker) => (
            <li key={speaker.id}>
              <span aria-hidden="true">{getInitials(speaker.name)}</span>
              <span>
                <strong>
                  {getTrimmedString(speaker.name) || labels.notAvailable}
                </strong>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="event-request-details-modal__empty">
          {labels.noSpeakers}
        </p>
      )}
    </EventRequestDetailsCard>
  );
}
