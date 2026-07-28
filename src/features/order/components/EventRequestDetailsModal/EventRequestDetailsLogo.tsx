import { useEffect, useState } from "react";
import { getTrimmedString } from "../../utils/getTrimmedString";
import type { EventRequestDetailsLogoProps } from "./EventRequestDetailsModal.types";
import { getInitials } from "./EventRequestDetailsModal.utils";

export function EventRequestDetailsLogo({
  logo,
  title,
  t,
}: EventRequestDetailsLogoProps) {
  const logoUrl = logo;
  const [hasImageError, setHasImageError] = useState(false);
  const eventTitle = getTrimmedString(title);
  const fallback = eventTitle
    ? getInitials(eventTitle)
    : t.order.details.emptyValue;
  const altText = `${t.order.eventRequests.details.logoAlt}: ${
    eventTitle || t.order.eventRequests.details.title
  }`;
  const imageUrl = logoUrl && !hasImageError ? logoUrl : null;

  useEffect(() => {
    setHasImageError(false);
  }, [eventTitle, logoUrl]);

  return (
    <span
      aria-hidden={imageUrl ? undefined : "true"}
      className="event-request-details-modal__avatar"
    >
      {imageUrl ? (
        <img
          alt={altText}
          onError={() => setHasImageError(true)}
          src={imageUrl}
        />
      ) : (
        fallback
      )}
    </span>
  );
}
