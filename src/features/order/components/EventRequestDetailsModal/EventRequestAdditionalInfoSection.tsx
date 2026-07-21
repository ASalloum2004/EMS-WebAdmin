import { GalleryIcon } from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import { EventRequestDetailsLogo } from "./EventRequestDetailsLogo";
import type { EventRequestAdditionalInfoSectionProps } from "./EventRequestDetailsModal.types";

export function EventRequestAdditionalInfoSection({
  logo,
  qrToken,
  t,
  title,
}: EventRequestAdditionalInfoSectionProps) {
  const labels = t.order.eventRequests.details;

  return (
    <EventRequestDetailsCard
      icon={<GalleryIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={labels.additionalInformation}
    >
      <dl className="event-request-details-modal__additional">
        <div>
          <dt>{labels.qrToken}</dt>
          <dd className="event-request-details-modal__qr-token">
            {getTrimmedString(qrToken) || labels.notAvailable}
          </dd>
        </div>
        <div>
          <dt>{labels.eventLogo}</dt>
          <dd>
            <EventRequestDetailsLogo
              className="event-request-details-modal__logo--compact"
              logo={logo}
              t={t}
              title={title}
            />
          </dd>
        </div>
      </dl>
    </EventRequestDetailsCard>
  );
}
