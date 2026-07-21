import { Card } from "../../../../components";
import type { EventRequestDetailsCardProps } from "./EventRequestDetailsModal.types";
import { classNames } from "./EventRequestDetailsModal.utils";

export function EventRequestDetailsCard({
  children,
  className,
  icon,
  title,
}: EventRequestDetailsCardProps) {
  return (
    <Card
      bodyClassName="event-request-details-modal__card-body"
      className={classNames("event-request-details-modal__card", className)}
      headerClassName="event-request-details-modal__card-header"
      icon={icon}
      iconClassName="event-request-details-modal__card-icon"
      title={title}
      titleClassName="event-request-details-modal__card-title"
    >
      {children}
    </Card>
  );
}
