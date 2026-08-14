import type { ReactNode } from "react";
import {
  NotesIcon,
  RequestOverviewIcon,
  ServiceIcon,
} from "../../../../assets/icons/orderIcons";
import { Card } from "../../../../components";
import type { I18nDictionary } from "../../../../i18n";
import type { BoothRequestDetailsApiData } from "../../types";
import { getTrimmedString } from "../../utils/getTrimmedString";
import { formatRequestDate } from "../orderTableColumns";
import "./BoothRequestDetailsMainColumn.scss";

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
      value:
        formatRequestDate(details.created_at, language) ||
        t.order.details.emptyValue,
    },
    {
      label: t.order.details.overview.requestType,
      value: t.order.details.overview.boothBooking,
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
  const isEmpty = details.services.length === 0;

  return (
    <DetailsCard
      className={`booth-request-details-modal__services-card${
        isEmpty
          ? " booth-request-details-modal__services-card--empty"
          : ""
      }`}
      icon={<ServiceIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.services.title}
    >
      {isEmpty ? (
        <div className="booth-request-details-modal__services-empty">
          <span className="booth-request-details-modal__services-empty-icon">
            <ServiceIcon aria-hidden="true" size={22} strokeWidth={1.8} />
          </span>
          <strong>{t.order.details.services.empty}</strong>
          <p>{t.order.details.services.emptyDescription}</p>
        </div>
      ) : (
        <ul
          className={`booth-request-details-modal__services-list${
            details.services.length > 3
              ? " booth-request-details-modal__services-list--scrollable"
              : ""
          }`}
        >
          {details.services.map((service, index) => {
            const serviceName =
              typeof service === "object" &&
              service !== null &&
              "name" in service
                ? getTrimmedString(service.name)
                : getTrimmedString(service);

            return (
              <li
                className="booth-request-details-modal__service-row"
                key={index}
              >
                <span className="booth-request-details-modal__service-icon">
                  <ServiceIcon
                    aria-hidden="true"
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>
                <strong>
                  {serviceName ||
                    t.order.details.services.detailsUnavailable}
                </strong>
              </li>
            );
          })}
        </ul>
      )}
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
  const notes = getTrimmedString(details.reason_for_booking);

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
    <div className="booth-request-details-modal__column booth-request-details-modal__column--main">
      <RequestOverview details={details} language={language} t={t} />
      <RequestedServices details={details} t={t} />
      <AdditionalNotes details={details} t={t} />
    </div>
  );
}
