import { useEffect, useState } from "react";
import { ContactIcon } from "../../../../assets/icons/orderIcons";
import type { EventRequestSpeakerDetails } from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type { EventRequestSpeakersSectionProps } from "./EventRequestDetailsModal.types";
import { getInitials } from "./EventRequestDetailsModal.utils";

function SpeakerAvatar({
  speaker,
}: {
  speaker: EventRequestSpeakerDetails;
}) {
  const [hasAvatarError, setHasAvatarError] = useState(false);

  useEffect(() => {
    setHasAvatarError(false);
  }, [speaker.avatar, speaker.id]);

  return (
    <span
      aria-hidden="true"
      className="event-request-details-modal__speaker-avatar"
    >
      {speaker.avatar && !hasAvatarError ? (
        <img
          alt=""
          onError={() => setHasAvatarError(true)}
          src={speaker.avatar}
        />
      ) : (
        getInitials(speaker.name)
      )}
    </span>
  );
}

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
              <SpeakerAvatar speaker={speaker} />
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
