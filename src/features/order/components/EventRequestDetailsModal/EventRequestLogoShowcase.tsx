import { useEffect, useState } from "react";
import { GalleryIcon } from "../../../../assets/icons/orderIcons";
import { getTrimmedString } from "../../utils/getTrimmedString";
import type { EventRequestLogoShowcaseProps } from "./EventRequestDetailsModal.types";
import { getSafeExternalUrl } from "./EventRequestDetailsModal.utils";

export function EventRequestLogoShowcase({
  logo,
  title,
  t,
}: EventRequestLogoShowcaseProps) {
  const labels = t.order.eventRequests.details;
  const logoUrl = getSafeExternalUrl(logo);
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = logoUrl && !hasImageError ? logoUrl : null;
  const eventTitle = getTrimmedString(title) || labels.title;

  useEffect(() => {
    setHasImageError(false);
  }, [logoUrl, title]);

  return (
    <div
      aria-label={imageUrl ? undefined : labels.logoShowcase.title}
      className="event-request-details-modal__logo-showcase"
      role={imageUrl ? undefined : "img"}
    >
      {imageUrl ? (
        <img
          alt={`${labels.logoShowcase.alt}: ${eventTitle}`}
          onError={() => setHasImageError(true)}
          src={imageUrl}
        />
      ) : (
        <>
          <GalleryIcon aria-hidden="true" size={30} strokeWidth={1.6} />
          <span>
            <strong>{labels.logoShowcase.title}</strong>
            <small>{labels.logoShowcase.description}</small>
          </span>
        </>
      )}
    </div>
  );
}
