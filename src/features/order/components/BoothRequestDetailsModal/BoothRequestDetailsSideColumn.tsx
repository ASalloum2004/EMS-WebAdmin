import { useEffect, useState, type ReactNode } from "react";
import {
  CompanyIcon,
  ContactIcon,
  EmailIcon,
  LinkedinIcon,
  LocationIcon,
  PhoneIcon,
  VerifiedCompanyIcon,
  WebsiteIcon,
} from "../../../../assets/icons/orderIcons";
import type { I18nDictionary } from "../../../../i18n";
import type {
  BoothRequestCompanyDetails,
  BoothRequestDetailsApiData,
  BoothRequestStatus,
} from "../../types";
import { DetailsCard, formatPrice } from "./BoothRequestDetailsMainColumn";

export function getCompanyInitials(companyName: string) {
  const initials = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((namePart) => namePart[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "—";
}

function getSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function getCompanyStatusLabel(status: string, t: I18nDictionary) {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus === "pending" ||
    normalizedStatus === "approved" ||
    normalizedStatus === "rejected"
  ) {
    return t.order.status[normalizedStatus as BoothRequestStatus];
  }

  return status.trim() || t.order.details.emptyValue;
}

export function CompanyAvatar({
  className,
  company,
}: {
  className?: string;
  company: BoothRequestCompanyDetails;
}) {
  const logoUrl = getSafeExternalUrl(company.logo.trim());
  const [hasLogoError, setHasLogoError] = useState(false);

  useEffect(() => {
    setHasLogoError(false);
  }, [company.name, logoUrl]);

  return (
    <span
      aria-hidden="true"
      className={`booth-request-details-modal__avatar${
        className ? ` ${className}` : ""
      }`}
    >
      {logoUrl && !hasLogoError ? (
        <img
          alt=""
          onError={() => setHasLogoError(true)}
          src={logoUrl}
        />
      ) : (
        getCompanyInitials(company.name)
      )}
    </span>
  );
}

function formatCoordinates(
  latitude: number,
  longitude: number,
  language: "en" | "ar",
) {
  const formatter = new Intl.NumberFormat(
    language === "ar" ? "ar-SY" : "en-US",
    { maximumFractionDigits: 6 },
  );

  return `${formatter.format(latitude)}, ${formatter.format(longitude)}`;
}

function CompanyProfile({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  const companyId =
    Number.isFinite(details.company.id) && details.company.id > 0
      ? details.company.id
      : details.company_id;
  const description = details.company.description.trim();

  return (
    <DetailsCard
      icon={<CompanyIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.companyProfile.title}
    >
      <div className="booth-request-details-modal__profile-identity">
        <CompanyAvatar
          className="booth-request-details-modal__avatar--large"
          company={details.company}
        />
        <span>
          <strong>{details.company.name}</strong>
          <small className="booth-request-details-modal__verified">
            <VerifiedCompanyIcon
              aria-hidden="true"
              size={14}
              strokeWidth={2}
            />
            {getCompanyStatusLabel(details.company.status, t)}
          </small>
        </span>
      </div>

      <dl className="booth-request-details-modal__profile-facts">
        <div>
          <dt>{t.order.details.companyProfile.companyId}</dt>
          <dd>#{companyId}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.industry}</dt>
          <dd>{details.company.business_sector}</dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.headquarters}</dt>
          <dd>
            <LocationIcon aria-hidden="true" size={15} strokeWidth={1.8} />
            <span dir="ltr">
              {formatCoordinates(
                details.company.headquarters_lat,
                details.company.headquarters_lng,
                language,
              )}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.order.details.companyProfile.yearFounded}</dt>
          <dd>{details.company.year_founded}</dd>
        </div>
      </dl>

      <p className="booth-request-details-modal__description">
        {description || t.order.details.emptyValue}
      </p>
    </DetailsCard>
  );
}

function ContactItem({
  children,
  href,
  icon,
}: {
  children: ReactNode;
  href?: string;
  icon: ReactNode;
}) {
  if (!href) {
    return (
      <span className="booth-request-details-modal__contact-link">
        {icon}
        <span>{children}</span>
      </span>
    );
  }

  return (
    <a className="booth-request-details-modal__contact-link" href={href}>
      {icon}
      <span>{children}</span>
    </a>
  );
}

function PointOfContact({
  details,
  t,
}: {
  details: BoothRequestDetailsApiData;
  t: I18nDictionary;
}) {
  const phone = details.company.phone.trim();
  const website = getSafeExternalUrl(
    details.company.social_links.website.trim(),
  );
  const linkedin = getSafeExternalUrl(
    details.company.social_links.linkedin.trim(),
  );

  return (
    <DetailsCard
      icon={<ContactIcon aria-hidden="true" size={19} strokeWidth={1.8} />}
      title={t.order.details.contact.title}
    >
      <div className="booth-request-details-modal__contact-person">
        <span className="booth-request-details-modal__contact-avatar">
          <ContactIcon aria-hidden="true" size={20} strokeWidth={1.8} />
        </span>
        <span>
          <strong>{t.order.details.emptyValue}</strong>
          <small>{t.order.details.contact.notAvailable}</small>
        </span>
      </div>

      <div className="booth-request-details-modal__contact-details">
        <ContactItem
          icon={<EmailIcon aria-hidden="true" size={16} strokeWidth={1.8} />}
        >
          {t.order.details.emptyValue}
        </ContactItem>
        <ContactItem
          href={phone ? `tel:${phone.replace(/\s/g, "")}` : undefined}
          icon={<PhoneIcon aria-hidden="true" size={16} strokeWidth={1.8} />}
        >
          {phone || t.order.details.emptyValue}
        </ContactItem>
      </div>

      <div
        aria-label={t.order.details.contact.socialLinks}
        className="booth-request-details-modal__social-links"
      >
        {website ? (
          <a
            aria-label={t.order.details.contact.website}
            href={website}
            rel="noopener noreferrer"
            target="_blank"
          >
            <WebsiteIcon aria-hidden="true" size={17} strokeWidth={1.8} />
          </a>
        ) : null}
        {linkedin ? (
          <a
            aria-label={t.order.details.contact.linkedin}
            href={linkedin}
            rel="noopener noreferrer"
            target="_blank"
          >
            <LinkedinIcon aria-hidden="true" size={17} strokeWidth={1.8} />
          </a>
        ) : null}
        {!website && !linkedin ? (
          <span className="booth-request-details-modal__social-empty">
            {t.order.details.emptyValue}
          </span>
        ) : null}
      </div>
    </DetailsCard>
  );
}

function TotalAmount({
  details,
  language,
  t,
}: {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}) {
  return (
    <DetailsCard
      className="booth-request-details-modal__total-card"
      title={t.order.details.services.totalAmount}
    >
      <strong className="booth-request-details-modal__total-amount">
        {formatPrice(details.final_price, language)}
      </strong>
    </DetailsCard>
  );
}

interface BoothRequestDetailsSideColumnProps {
  details: BoothRequestDetailsApiData;
  language: "en" | "ar";
  t: I18nDictionary;
}

export function BoothRequestDetailsSideColumn({
  details,
  language,
  t,
}: BoothRequestDetailsSideColumnProps) {
  return (
    <div className="booth-request-details-modal__column">
      <CompanyProfile details={details} language={language} t={t} />
      <PointOfContact details={details} t={t} />
      <TotalAmount details={details} language={language} t={t} />
    </div>
  );
}
