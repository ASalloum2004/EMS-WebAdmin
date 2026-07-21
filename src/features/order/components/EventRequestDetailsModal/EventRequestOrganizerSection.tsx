import { CompanyIcon } from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { EventRequestDetailsCard } from "./EventRequestDetailsCard";
import type {
  EventRequestOrganizerLinkProps,
  EventRequestOrganizerSectionProps,
} from "./EventRequestDetailsModal.types";
import {
  classNames,
  getInitials,
  getSafeExternalUrl,
  getSafeTelephoneUrl,
  getStatusLabel,
  getStatusModifier,
} from "./EventRequestDetailsModal.utils";

function OrganizerLink({
  href,
  label,
  unavailable,
}: EventRequestOrganizerLinkProps) {
  return (
    <div className="event-request-details-modal__organizer-link">
      <span>{label}</span>
      {href ? (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {href}
        </a>
      ) : (
        <strong>{unavailable}</strong>
      )}
    </div>
  );
}

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

  const phone = getTrimmedString(organizer.phone);
  const phoneUrl = getSafeTelephoneUrl(phone);
  const website = getSafeExternalUrl(organizer.social_links?.website);
  const linkedin = getSafeExternalUrl(organizer.social_links?.linkedin);
  const companyStatus = getStatusLabel(organizer.status, t);

  return (
    <EventRequestDetailsCard
      icon={cardIcon}
      title={labels.organizerInformation}
    >
      <div className="event-request-details-modal__organizer-heading">
        <span
          aria-hidden="true"
          className="event-request-details-modal__organizer-avatar"
        >
          {getInitials(organizer.name)}
        </span>
        <span>
          <small>{labels.companyName}</small>
          <strong>
            {getTrimmedString(organizer.name) || labels.notAvailable}
          </strong>
        </span>
        <span
          aria-label={`${labels.companyStatus}: ${companyStatus}`}
          className={classNames(
            "event-request-details-modal__company-status",
            `event-request-details-modal__company-status--${getStatusModifier(
              organizer.status,
            )}`,
          )}
        >
          {companyStatus}
        </span>
      </div>

      <dl className="event-request-details-modal__organizer-facts">
        <div>
          <dt>{labels.companyId}</dt>
          <dd>#{organizer.id}</dd>
        </div>
        <div>
          <dt>{labels.businessSector}</dt>
          <dd>
            {getTrimmedString(organizer.business_sector) || labels.notAvailable}
          </dd>
        </div>
        <div>
          <dt>{labels.phone}</dt>
          <dd>
            {phone && phoneUrl ? (
              <a dir="ltr" href={phoneUrl}>
                {phone}
              </a>
            ) : (
              phone || labels.notAvailable
            )}
          </dd>
        </div>
        <div>
          <dt>{labels.yearFounded}</dt>
          <dd>{organizer.year_founded ?? labels.notAvailable}</dd>
        </div>
        <div>
          <dt>{labels.companyStatus}</dt>
          <dd>{companyStatus}</dd>
        </div>
      </dl>

      <div className="event-request-details-modal__organizer-description">
        <strong>{labels.companyDescription}</strong>
        <p>
          {getTrimmedString(organizer.description) || labels.notAvailable}
        </p>
      </div>

      <div className="event-request-details-modal__organizer-links">
        <OrganizerLink
          href={website}
          label={labels.website}
          unavailable={labels.notAvailable}
        />
        <OrganizerLink
          href={linkedin}
          label={labels.linkedin}
          unavailable={labels.notAvailable}
        />
      </div>
    </EventRequestDetailsCard>
  );
}
