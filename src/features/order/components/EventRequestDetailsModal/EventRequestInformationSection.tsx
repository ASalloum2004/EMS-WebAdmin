import {
  NotesIcon,
  RequestOverviewIcon,
} from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type { EventRequestInformationSectionProps } from "./EventRequestDetailsModal.types";
import {
  formatCreatedDate,
  formatDateTime,
  formatDuration,
} from "./EventRequestDetailsModal.utils";

export function EventRequestInformationSection({
  details,
  language,
  t,
}: EventRequestInformationSectionProps) {
  const labels = t.order.eventRequests.details;

  return (
    <>
      <EventRequestDetailsCard
        icon={
          <RequestOverviewIcon
            aria-hidden="true"
            size={19}
            strokeWidth={1.8}
          />
        }
        title={labels.eventInformation}
      >
        <dl className="event-request-details-modal__facts">
          <div>
            <dt>{labels.eventHall}</dt>
            <dd>
              {details.event_hall_id === null
                ? labels.notAvailable
                : `#${details.event_hall_id}`}
            </dd>
          </div>
          <div>
            <dt>{labels.startTime}</dt>
            <dd>{formatDateTime(details.start_at, language, t)}</dd>
          </div>
          <div>
            <dt>{labels.endTime}</dt>
            <dd>{formatDateTime(details.end_at, language, t)}</dd>
          </div>
          <div>
            <dt>{labels.duration}</dt>
            <dd>{formatDuration(details.duration, language, t)}</dd>
          </div>
          <div>
            <dt>{labels.createdAt}</dt>
            <dd>{formatCreatedDate(details.created_at, language, t)}</dd>
          </div>
        </dl>
      </EventRequestDetailsCard>

      <EventRequestDetailsCard
        icon={<NotesIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
        title={labels.description}
      >
        <p className="event-request-details-modal__description">
          {getTrimmedString(details.description) || labels.notAvailable}
        </p>
      </EventRequestDetailsCard>
    </>
  );
}
