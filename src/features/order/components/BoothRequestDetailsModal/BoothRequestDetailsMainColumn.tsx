import type { ReactNode } from "react";
import {
  NotesIcon,
  RequestOverviewIcon,
  ServiceIcon,
} from "../../../../assets/icons/orderIcons";
import { Card } from "../../../../components";
import type { I18nDictionary } from "../../../../i18n";
import type { BoothRequestDetailsApiData } from "../../types";
import { formatRequestDate } from "../orderTableColumns";

interface DetailsCardProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title: string;
}

export function DetailsCard({
  children,
  className,
  icon,
  title,
}: DetailsCardProps) {
  return (
    <Card
      bodyClassName="booth-request-details-modal__card-body"
      className={`booth-request-details-modal__card${
        className ? ` ${className}` : ""
      }`}
      headerClassName="booth-request-details-modal__card-header"
      icon={icon}
      iconClassName="booth-request-details-modal__card-icon"
      title={title}
      titleClassName="booth-request-details-modal__card-title"
    >
      {children}
    </Card>
  );
}

export function formatPrice(amount: number, language: "en" | "ar") {
  return new Intl.NumberFormat(language === "ar" ? "ar-SY" : "en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

function RequestOverview({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  const overviewItems = [
    {
      label: t.order.details.overview.submissionDate,
      value: formatRequestDate(details.created_at, language),
    },
    {
      label: t.order.details.overview.requestType,
      value: t.order.details.overview.boothBooking,
    },
    {
      label: t.order.details.overview.allocatedSpace,
      value: `${t.order.table.boothPrefix} #${details.booth_id}`,
    },
    {
      label: t.order.details.overview.requestedServices,
      value: String(details.services.length),
    },
  ];

  return (
    <DetailsCard
      icon={
        <RequestOverviewIcon aria-hidden="true" size={19} strokeWidth={1.8} />
      }
      title={t.order.details.overview.title}
    >
      <dl className="booth-request-details-modal__overview-grid">
        {overviewItems.map((item) => (
          <div
            className="booth-request-details-modal__overview-item"
            key={item.label}
          >
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </DetailsCard>
  );
}

function RequestedServices({
  details,
  t,
}: {
  details: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      className="booth-request-details-modal__services-card"
      icon={<ServiceIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.services.title}
    >
      <p className="booth-request-details-modal__services-empty">
        {details.services.length === 0
          ? t.order.details.services.empty
          : t.order.details.services.detailsUnavailable}
      </p>
    </DetailsCard>
  );
}

function AdditionalNotes({
  details,
  t,
}: {
  details: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  const notes =
    typeof details.reason_for_booking === "string"
      ? details.reason_for_booking.trim()
      : "";

  return (
    <DetailsCard
      icon={<NotesIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.notes.title}
    >
      <p className="booth-request-details-modal__notes">
        {notes || t.order.details.emptyValue}
      </p>
    </DetailsCard>
  );
}

interface BoothRequestDetailsMainColumnProps {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}

export function BoothRequestDetailsMainColumn({
  details,
  language,
  t,
}: BoothRequestDetailsMainColumnProps) {
  return (
    <div className="booth-request-details-modal__column">
      <RequestOverview details={details} language={language} t={t} />
      <RequestedServices details={details} t={t} />
      <AdditionalNotes details={details} t={t} />
    </div>
  );
}
