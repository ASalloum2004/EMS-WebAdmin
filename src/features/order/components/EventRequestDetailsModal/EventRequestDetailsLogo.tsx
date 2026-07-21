import { useEffect, useState } from "react";
import { getTrimmedString } from "../../utils/getTrimmedString";
import type { EventRequestDetailsLogoProps } from "./EventRequestDetailsModal.types";
import { getInitials, getSafeExternalUrl } from "./EventRequestDetailsModal.utils";

export function EventRequestDetailsLogo({
  logo,
  title,
  t,
}: EventRequestDetailsLogoProps) {
  const logoUrl = getSafeExternalUrl(logo);
  const [hasImageError, setHasImageError] = useState(false);
  const eventTitle =
    getTrimmedString(title) || t.order.eventRequests.details.title;
  const altText = `${t.order.eventRequests.details.logoAlt}: ${eventTitle}`;

  useEffect(() => {
    setHasImageError(false);
  }, [eventTitle, logoUrl]);

  return (
    <span className="event-request-details-modal__avatar">
      {logoUrl && !hasImageError ? (
        <img
          alt={altText}
          onError={() => setHasImageError(true)}
          src={logoUrl}
        />
      ) : (
        <span aria-hidden="true">{getInitials(eventTitle)}</span>
      )}
    </span>
  );
}
